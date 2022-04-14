import { Injectable, Inject, HttpStatus, Logger } from '@nestjs/common';
import { PG_CONNECTION } from 'src/constants';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/service/user.service';
import { NftService } from '../../nft/service/nft.service';
import { MintService } from '../../nft/service/mint.service';
import { Err } from 'ts-results';
import { Cron, CronExpression } from '@nestjs/schedule';
import { assertEnv } from 'src/utils';
import { DbTransaction, withTransaction, DbPool } from 'src/db.module';

export enum PaymentStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  CANCELED = 'canceled',
  TIMED_OUT = 'timedOut',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  TEST = 'test_provider',
}

interface NftOrder {
  id: number;
  userId: number;
  orderAt: number;
}

export interface PaymentIntent {
  amount: number;
  currency: string;
  clientSecret: string;
  id: string;
}

@Injectable()
export class PaymentService {
  stripe = process.env.STRIPE_SECRET
    ? require('stripe')(process.env.STRIPE_SECRET)
    : undefined;

  FINAL_STATES = [
    PaymentStatus.FAILED,
    PaymentStatus.SUCCEEDED,
    PaymentStatus.CANCELED,
  ];

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

  async createPayment(
    userId: number,
    paymentProvider: PaymentProvider,
  ): Promise<PaymentIntent> {
    return await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const preparedOrder = await this.#createOrder(
        dbTx,
        userId,
        paymentProvider,
      );
      let paymentIntent = await this.#createPaymentIntent(
        preparedOrder.amount,
        paymentProvider,
      );
      await this.#registerPayment(
        dbTx,
        paymentProvider,
        paymentIntent.id,
        preparedOrder.nftOrder.id,
      );
      return paymentIntent;
    }).catch((err: any) => {
      Logger.error(`Err on creating nft order (userId=${userId}, err: ${err}`);
      throw err;
    });
  }

  // Prepare the cart, order and amount for payment
  async #createOrder(
    dbTx: DbTransaction,
    userId: number,
    provider: PaymentProvider,
  ): Promise<{ amount: number; nftOrder: NftOrder }> {
    const cartSessionRes = await this.userService.getUserCartSession(
      userId,
      dbTx,
    );

    if (!cartSessionRes.ok || typeof cartSessionRes.val !== 'string') {
      throw cartSessionRes.val;
    }
    const cartSession: string = cartSessionRes.val;

    const nftOrder = await this.#registerOrder(
      dbTx,
      cartSession,
      userId,
      provider,
    );
    const cartList = await this.userService.cartList(cartSession, dbTx);
    const amount = cartList.nfts.reduce((sum, nft) => sum + nft.price, 0) * 100; // TODO: decide about how to represent decimals (cents)

    return { amount: amount, nftOrder: nftOrder };
  }

  async #registerOrder(
    dbTx: DbTransaction,
    session: string,
    userId: number,
    provider: PaymentProvider,
  ): Promise<NftOrder> {
    const cartMeta = await this.userService.getCartMeta(session, dbTx);
    if (typeof cartMeta === 'undefined') {
      throw Err(`registerOrder err: cart should not be empty`);
    }

    try {
      if (
        cartMeta.orderId &&
        typeof cartMeta.orderId !== 'undefined' &&
        (await this.#nftOrderHasPaymentEntry(cartMeta.orderId, dbTx))
      ) {
        await this.cancelNftOrderId(dbTx, cartMeta.orderId, provider);
      }

      const orderAt = new Date();

      const orderQryRes = await dbTx.query(
        `
INSERT INTO nft_order (
  user_id, order_at
)
VALUES ($1, $2)
RETURNING id`,
        [userId, orderAt.toUTCString()],
      );
      const nftOrderId: number = orderQryRes.rows[0]['id'];

      await dbTx.query(
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

      await dbTx.query(
        `
UPDATE cart_session
SET order_id = $1
WHERE id = $2
        `,
        [nftOrderId, cartMeta.id],
      );

      return <NftOrder>{
        id: nftOrderId,
        orderAt: Math.floor(orderAt.getTime() / 1000),
        userId: userId,
      };
    } catch (err: any) {
      Logger.error(
        `Err on creating order in db (provider=${provider}, cartSessionId=${cartMeta.id}, err: ${err}`,
      );
      throw err;
    }
  }

  async #createPaymentIntent(
    amount: number,
    paymentProvider: PaymentProvider,
  ): Promise<PaymentIntent> {
    switch (paymentProvider) {
      case PaymentProvider.STRIPE:
        return await this.#createStripePaymentIntent(amount);
      case PaymentProvider.TEST:
        return {
          amount,
          currency: 'eur',
          clientSecret: '..',
          id: `stripe_test_id${new Date().getTime().toString()}`,
        };
    }
  }

  async #createStripePaymentIntent(amount: number): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'eur', // Have to change this to handle different currencies
      automatic_payment_methods: {
        enabled: false,
      },
    });

    // add multiple currency later on
    return {
      amount,
      currency: 'eur',
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    };
  }

  async #registerPayment(
    dbTx: DbTransaction,
    provider: PaymentProvider,
    paymentId: string,
    nftOrderId: number,
  ) {
    try {
      const expireAt = this.#newPaymentExpiration();
      await dbTx.query(
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

  #newPaymentExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setTime(
      expiresAt.getTime() + Number(assertEnv('ORDER_EXPIRATION_MILLI_SECS')),
    );
    return expiresAt;
  }

  async editPaymentStatus(
    paymentId: string,
    status: PaymentStatus,
  ): Promise<PaymentStatus | undefined> {
    return await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const qryPrevStatus = await dbTx.query(
        `
SELECT status
FROM payment
WHERE payment_id = $1
        `,
        [paymentId],
      );

      await dbTx.query(
        `
UPDATE payment
SET status = $1
WHERE payment_id = $2
  AND NOT status = ANY($3)
        `,
        [status, paymentId, this.FINAL_STATES],
      );

      return qryPrevStatus.rows[0]
        ? qryPrevStatus.rows[0]['status']
        : undefined;
    }).catch((err: any) => {
      Logger.error(
        `Err on updating payment status in db (paymentId=${paymentId}, newStatus=${status}), err: ${err}`,
      );
      throw err;
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async deleteExpiredPayments() {
    const cancelOrderIds = await this.conn.query(
      `
SELECT
  nft_order_id,
  provider,
  expires_at
FROM payment
WHERE expires_at < now() AT TIME ZONE 'UTC'
  AND status = ANY($1)
    `,
      [[PaymentStatus.CREATED, PaymentStatus.PROCESSING]],
    );

    for (const row of cancelOrderIds.rows) {
      await withTransaction(this.conn, async (dbTx: DbTransaction) => {
        await this.cancelNftOrderId(
          dbTx,
          Number(row['nft_order_id']),
          row['provider'],
          PaymentStatus.TIMED_OUT,
        );
        Logger.warn(
          `canceled following expired order session: ${row['payment_id']}`,
        );
      });
    }
  }

  async cancelNftOrderId(
    dbTx: DbTransaction,
    orderId: number,
    provider: PaymentProvider,
    newStatus:
      | PaymentStatus.CANCELED
      | PaymentStatus.TIMED_OUT = PaymentStatus.CANCELED,
  ) {
    const paymentIntentId = await dbTx.query(
      `
UPDATE payment
SET status = $2
WHERE nft_order_id = $1
AND status = ANY($3)
RETURNING payment_id
      `,
      [
        orderId,
        newStatus,
        [
          PaymentStatus.CREATED,
          PaymentStatus.PROCESSING,
          PaymentStatus.TIMED_OUT,
        ],
      ],
    );

    if (paymentIntentId.rowCount === 0) {
      throw Err(
        `paymentIntentCancel failed (orderId=${orderId}), err: no payment exists with matching orderId and cancellable status`,
      );
    }

    try {
      if (provider === PaymentProvider.STRIPE) {
        await this.stripe.paymentIntents.cancel(
          paymentIntentId.rows[0]['payment_id'],
        );
      }
    } catch (err: any) {
      throw Err(`Err on canceling nft order (orderId=${orderId}, err: ${err}`);
    }
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

    return await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const nftIds = await this.#assignOrderNftsToUser(dbTx, orderId);
      if (nftIds.length === 0) {
        return false;
      }
      const nfts = await this.nftService.findByIds(nftIds);

      // Don't await results of the transfers. Finish the checkout, any issues
      // should be solved asynchronously to the checkout process itself.
      this.mintService.transfer_nfts(nfts, userAddress);

      return true;
    }).catch((err: any) => {
      Logger.error(
        `failed to checkout order (orderId=${orderId}), err: ${err}`,
      );
      throw err;
    });
  }

  async #nftOrderHasPaymentEntry(
    orderId: number,
    dbTx: DbTransaction | DbPool = this.conn,
  ): Promise<boolean> {
    const qryRes = await dbTx.query(
      `
SELECT 1
FROM payment
WHERE nft_order_id = $1
  AND NOT status = ANY($2)
      `,
      [orderId, this.FINAL_STATES],
    );
    return qryRes.rowCount === 1;
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
}
