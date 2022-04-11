import { Injectable, Inject, Logger } from '@nestjs/common';
import { PG_CONNECTION } from 'src/constants';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/service/user.service';
import { NftService } from '../../nft/service/nft.service';
import { MintService } from '../../nft/service/mint.service';
import { Err } from 'ts-results';
import { Cron, CronExpression } from '@nestjs/schedule';
import { assertEnv } from 'src/utils';

export enum PaymentStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  CANCELED = 'canceled',
  TIMED_OUT = 'timedOut',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum PaymentProviderEnum {
  STRIPE = 'stripe',
  TEST = 'test_provider',
}

interface NftOrder {
  id: number;
  userId: number;
  orderAt: number;
}

export interface StripePaymentIntent {
  amount: number;
  currency: string;
  clientSecret: string;
  vatAmount: number;
  vatRate: number;
  id: string;
}

@Injectable()
export class PaymentService {
  stripe = process.env.STRIPE_SECRET
    ? require('stripe')(process.env.STRIPE_SECRET)
    : undefined;

  FINAL_STATES = [PaymentStatus.FAILED, PaymentStatus.SUCCEEDED];

  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private readonly mintService: MintService,
    private readonly userService: UserService,
    private readonly nftService: NftService,
  ) {}

  async webhookHandler(constructedEvent: any) {
    let paymentStatus: PaymentStatus;

    switch (constructedEvent.type) {
      case 'payment_intent.succeeded':
        paymentStatus = PaymentStatus.SUCCEEDED;
        break;
      case 'payment_intent.processing':
        paymentStatus = PaymentStatus.PROCESSING;
        break;
      case 'payment_intent.canceled':
        paymentStatus = PaymentStatus.CANCELED;
        break;
      case 'payment_intent.payment_failed':
        paymentStatus = PaymentStatus.FAILED;
        break;
      case 'payment_intent.created':
        paymentStatus = PaymentStatus.CREATED;
        break;
      default:
        Logger.error(`Unhandled event type ${constructedEvent.type}`);
        throw Err('Unknown stripe webhook event');
    }

    const previousStatus = await this.editPaymentStatus(
      constructedEvent.data.object.id,
      paymentStatus,
    );

    if (
      !this.FINAL_STATES.includes(previousStatus!) &&
      paymentStatus === PaymentStatus.SUCCEEDED
    ) {
      const orderId = await this.getPaymentOrderId(
        constructedEvent.data.object.id,
      );
      await this.orderCheckout(orderId);
      await this.userService.deleteCartSession(orderId);
    }
  }

  // Prepare the cart, order and amount for payment
  async preparePayment(
    userId: number,
    provider: PaymentProviderEnum,
  ): Promise<{ amount: number; nftOrder: NftOrder }> {
    const cartSessionRes = await this.userService.getUserCartSession(userId);

    if (!cartSessionRes.ok || typeof cartSessionRes.val !== 'string') {
      throw cartSessionRes.val;
    }
    const cartSession: string = cartSessionRes.val;

    const cartList = await this.userService.cartList(cartSession);
    const nftOrder = await this.createNftOrder(cartSession, userId, provider);

    const amount = cartList.nfts.reduce((sum, nft) => sum + nft.price, 0);

    return { amount: amount, nftOrder: nftOrder };
  }

  async createStripePayment(
    amountBaseUnit: number,
    user: UserEntity,
    ipAddress: string,
  ): Promise<StripePaymentIntent> {
    const vatRate = await this.getVatRate(ipAddress);

    if (typeof vatRate === 'undefined') {
      throw Error('Country not supported');
    }

    const amountVatExcl = amountBaseUnit * 100;
    const amountVatIncl = amountVatExcl + amountVatExcl * (vatRate / 100.0);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountVatIncl,
      currency: 'eur', // Have to change this to handle different currencies
      automatic_payment_methods: {
        enabled: false,
      },
    });

    // add multiple currency later on
    return {
      amount: amountVatExcl,
      currency: 'eur',
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      vatAmount: amountVatIncl,
      vatRate: vatRate,
    };
  }

  newOrderExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setTime(
      expiresAt.getTime() + Number(assertEnv('ORDER_EXPIRATION_MILLI_SECS')),
    );
    return expiresAt;
  }

  async createPayment(
    provider: PaymentProviderEnum,
    paymentId: string,
    nftOrderId: number,
  ) {
    try {
      const expireAt = this.newOrderExpiration();
      await this.conn.query(
        `
  INSERT INTO payment (
    payment_id, status, nft_order_id, provider, expires_at
  )
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id`,
        [
          paymentId,
          PaymentStatus.CREATED,
          nftOrderId,
          provider,
          expireAt.toUTCString(),
        ],
      );
    } catch (err: any) {
      Logger.error(
        `Err on storing payment intent in db (provider=${provider}, paymentId=${paymentId}, nftOrderId=${nftOrderId}), err: ${err}`,
      );
      throw err;
    }
  }

  async editPaymentStatus(
    paymentId: string,
    status: PaymentStatus,
  ): Promise<PaymentStatus | undefined> {
    const tx = await this.conn.connect();
    try {
      await tx.query('BEGIN');
      const qryPrevStatus = await tx.query(
        `
SELECT status
FROM payment
WHERE payment_id = $1
        `,
        [paymentId],
      );

      await tx.query(
        `
UPDATE payment
SET status = $1
WHERE payment_id = $2
  AND NOT status = ANY($3::payment_status[])`,
        [status, paymentId, this.FINAL_STATES],
      );

      await tx.query('commit');

      return qryPrevStatus.rows[0]
        ? qryPrevStatus.rows[0]['status']
        : undefined;
    } catch (err) {
      await tx.query('ROLLBACK');
      Logger.error(
        `Err on updating payment status in db (paymentId=${paymentId}, newStatus=${status}), err: ${err}`,
      );
      throw err;
    } finally {
      tx.release();
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async deleteExpiredPayments() {
    const canceledPaymentsIds = await this.conn.query(
      `
      UPDATE payment
      SET status = $1
      WHERE expires_at < now() AT TIME ZONE 'UTC'
        AND status IN ($2, $3)
      RETURNING payment_id, expires_at
    `,
      [
        PaymentStatus.TIMED_OUT,
        PaymentStatus.CREATED,
        PaymentStatus.PROCESSING,
      ],
    );

    for (const row of canceledPaymentsIds.rows) {
      try {
        await this.stripe.paymentIntents.cancel(row['payment_id']);
        Logger.warn(
          `canceled following expired order session: ${row['payment_id']}`,
        );
      } catch (err: any) {
        Logger.error(
          `failed to cancel expired order (paymentId=${row['payment_id']}), err: ${err}`,
        );
      }
    }
  }

  async cancelNftOrderId(orderId: number, provider: PaymentProviderEnum) {
    const paymentIntentId = await this.conn.query(
      `
UPDATE payment
SET status = $2
WHERE nft_order_id = $1
AND status IN ($3, $4, $5)
RETURNING payment_id
      `,
      [
        orderId,
        PaymentStatus.CANCELED,
        PaymentStatus.CREATED,
        PaymentStatus.PROCESSING,
        PaymentStatus.TIMED_OUT,
      ],
    );

    if (!paymentIntentId.rowCount) {
      return;
    }

    try {
      if (provider === PaymentProviderEnum.STRIPE) {
        await this.stripe.paymentIntents.cancel(
          paymentIntentId.rows[0]['payment_id'],
        );
      }
    } catch (err: any) {
      throw Err(`paymentIntentCancel failed (orderId=${orderId}), err: ${err}`);
    }
  }

  async createNftOrder(
    session: string,
    userId: number,
    provider: PaymentProviderEnum,
  ): Promise<NftOrder> {
    const cartMeta = await this.userService.getCartMeta(session);
    if (typeof cartMeta === 'undefined') {
      throw Err(`createNftOrder err: cart should not be empty`);
    }

    if (cartMeta.orderId && typeof cartMeta.orderId !== 'undefined') {
      await this.cancelNftOrderId(cartMeta.orderId, provider);
    }

    let nftOrderId: number;
    const orderAt = new Date();

    const tx = await this.conn.connect();
    try {
      await tx.query('BEGIN');
      const nftQryRes = await tx.query(
        `
INSERT INTO nft_order (
  user_id, order_at
)
VALUES ($1, $2)
RETURNING id`,
        [userId, orderAt.toUTCString()],
      );
      nftOrderId = nftQryRes.rows[0]['id'];

      await tx.query(
        `
INSERT INTO mtm_nft_order_nft (
  nft_order_id, nft_id
)
SELECT $1, nft_id
FROM mtm_cart_session_nft
WHERE cart_session_id = $2
        `,
        [nftOrderId, cartMeta.id],
      );

      await tx.query(
        `
UPDATE cart_session
SET order_id = $1
WHERE id = $2
        `,
        [nftOrderId, cartMeta.id],
      );

      await tx.query('COMMIT');
    } catch (err) {
      Logger.error(
        `Err on creating nft order (userId=${userId}, cartSession=${session}), err: ${err}`,
      );
      await tx.query('ROLLBACK');
      throw err;
    } finally {
      tx.release();
    }

    return <NftOrder>{
      id: nftOrderId,
      orderAt: Math.floor(orderAt.getTime() / 1000),
      userId: userId,
    };
  }

  async getPaymentOrderId(paymentId: string): Promise<number> {
    const qryRes = await this.conn.query(
      `
SELECT nft_order_id
FROM payment
WHERE payment_id = $1
      `,
      [paymentId],
    );
    return qryRes.rows[0]['nft_order_id'];
  }

  async getOrderUserAddress(orderId: number): Promise<string> {
    const qryRes = await this.conn.query(
      `
SELECT address
FROM nft_order
JOIN kanvas_user
  ON kanvas_user.id = nft_order.user_id
WHERE nft_order.id = $1
      `,
      [orderId],
    );

    return qryRes.rows[0]['address'];
  }

  async orderCheckout(orderId: number): Promise<boolean> {
    const userAddress = await this.getOrderUserAddress(orderId);

    const dbTx = await this.conn.connect();
    try {
      await dbTx.query(`BEGIN`);

      const nftIds = await this.#assignOrderNftsToUser(dbTx, orderId);
      if (nftIds.length === 0) {
        return false;
      }
      const nfts = await this.nftService.findByIds(nftIds);

      // Don't await results of the transfers. Finish the checkout, any issues
      // should be solved asynchronously to the checkout process itself.
      this.mintService.transfer_nfts(nfts, userAddress);

      await dbTx.query(`COMMIT`);
    } catch (err: any) {
      await dbTx.query(`ROLLBACK`);
      Logger.error(
        `failed to checkout order (orderId=${orderId}), err: ${err}`,
      );
      throw err;
    } finally {
      dbTx.release();
    }
    return true;
  }

  async #assignOrderNftsToUser(dbTx: any, orderId: number): Promise<number[]> {
    const nftIds = await dbTx.query(
      `
INSERT INTO mtm_kanvas_user_nft (
  kanvas_user_id, nft_id
)
SELECT nft_order.user_id, mtm.nft_id
FROM mtm_nft_order_nft AS mtm
JOIN nft_order
  ON nft_order.id = $1
WHERE nft_order_id = $1
RETURNING nft_id
`,
      [orderId],
    );

    return nftIds.rows.map((row: any) => row.nft_id);
  }

  // Test functions
  async getPaymentIdForLatestUserOrder(
    userId: number,
  ): Promise<{ payment_id: string; order_id: number; status: PaymentStatus }> {
    const qryRes = await this.conn.query(
      `
SELECT payment_id, status, nft_order.id as order_id
FROM payment
JOIN nft_order
ON nft_order.id = payment.nft_order_id
WHERE nft_order_id = (
  SELECT nft_order.id as order_id
  FROM nft_order
  WHERE user_id = $1
  ORDER BY nft_order.id DESC
  LIMIT 1
)
ORDER BY payment.id DESC
      `,
      [userId],
    );

    return {
      payment_id: qryRes.rows[0]['payment_id'],
      order_id: qryRes.rows[0]['order_id'],
      status: qryRes.rows[0]['status'],
    };
  }

  // Note: returned value is a percentage (number between 0 and 100)
  async getVatRate(ipAddress: string): Promise<number | undefined> {
    const intIpAddress = this.dot2num(ipAddress);

    const qryRes = await this.conn.query(
      `
SELECT
  country.id as country_id,
  vat.rate
FROM ip_country
LEFT JOIN country
  ON country.id = ip_country.country_id
LEFT JOIN vat
  ON vat.id = country.vat_id
WHERE ip_country.ip_from <= $1
  AND ip_country.ip_to >= $1
      `,
      [intIpAddress],
    );

    if (qryRes.rows[0]['country_id'] === null) {
      Logger.warn(`Unmapped country for ip address ${ipAddress}`);
    }

    return qryRes.rows[0]['rate'];
  }

  dot2num(ip: string) {
    const ipParts = ip.split('.');
    return (
      ((+ipParts[0] * 256 + +ipParts[1]) * 256 + +ipParts[2]) * 256 +
      +ipParts[3]
    );
  }
}
