import { Injectable, Inject, HttpStatus, Logger } from '@nestjs/common';
import { PG_CONNECTION, ORDER_EXPIRATION_MILLI_SECS } from 'src/constants';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/service/user.service';
import { NftService } from '../../nft/service/nft.service';
import { MintService } from '../../nft/service/mint.service';
import { Err } from 'ts-results';
import { Cron, CronExpression } from '@nestjs/schedule';

export enum PaymentStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  CANCELED = 'canceled',
  TIMED_OUT = 'timedOut',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

interface NftOrder {
  id: number;
  userId: number;
  orderAt: number;
}

export interface StripePaymentIntent {
  clientSecret: string;
}

@Injectable()
export class PaymentService {
  stripe = process.env.STRIPE_SECRET
    ? require('stripe')(process.env.STRIPE_SECRET)
    : undefined;

  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private readonly mintService: MintService,
    private readonly userService: UserService,
    private readonly nftService: NftService,
  ) {}

  async createStripePayment(user: UserEntity): Promise<StripePaymentIntent> {
    const cartSessionRes = await this.userService.getUserCartSession(user.id);
    if (!cartSessionRes.ok || cartSessionRes.val !== 'string') {
      throw cartSessionRes.val;
    }
    const cartSession: string = cartSessionRes.val;
    const nftOrder = await this.createNftOrder(cartSession, user.id);

    const cartList = await this.userService.cartList(cartSession);
    const amount = cartList.nfts.reduce((sum, nft) => sum + nft.price, 0);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'eur', // Have to change this to handle different currencies
      automatic_payment_methods: {
        enabled: false,
      },
    });

    // Fetch
    // if order and payment not yet set:
    // else create

    await this.createPayment('stripe', paymentIntent.id, nftOrder.id);

    return { clientSecret: paymentIntent.client_secret };
  }

  newOrderExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + ORDER_EXPIRATION_MILLI_SECS);
    return expiresAt;
  }

  async createPayment(provider: string, paymentId: string, nftOrderId: number) {
    try {
      const expireAt = this.newOrderExpiration();
      await this.conn.query(
        `
  INSERT INTO payment (
    payment_id, status, nft_order_id, provider, expire_at
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
        `Err on storing payment intent in db (provider='stripe', paymentId=${paymentId}, nftOrderId=${nftOrderId}), err: ${err}`,
      );
      throw err;
    }
  }

  async editPaymentStatus(status: PaymentStatus, paymentId: string) {
    try {
      // Add check to verify if status is created or processing

      await this.conn.query(
        `
  UPDATE payment
  SET status = $1
  WHERE payment_id = $2`,
        [status, paymentId],
      );
    } catch (err) {
      Logger.error(
        `Err on updating payment status in db (paymentId=${paymentId}, newStatus=${status}), err: ${err}`,
      );
      throw err;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async deleteExpiredPayments() {
    const canceledPaymentsIds = await this.conn.query(`
      UPDATE payment
      SET status = 'timedOut'
      WHERE expires_at < now() AT TIME ZONE 'UTC'
        AND status IN ('created', 'processing')
      RETURNING payment_id
    `);

    for (const row of canceledPaymentsIds.rows) {
      try {
        await this.stripe.paymentIntents.cancel(row.paymentId);
        Logger.warn(
          `cancelled following expired order session: ${row.paymentId}`,
        );
      } catch (err: any) {
        Logger.error(
          `failed to cancel expired order (paymentId=${row.paymentId}), err: ${err}`,
        );
      }
    }
  }

  async cancelNftOrderId(orderId: number) {
    const paymentIntentId = await this.conn.query(
      `
    UPDATE payment
    SET status = 'canceled'
    WHERE order_id = $1
    RETURNING payment_id
      `,
      [orderId],
    );

    try {
      await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (err: any) {
      throw Err(`paymentIntentCancel failed (orderId=${orderId}), err: ${err}`);
    }
  }

  async createNftOrder(session: string, userId: number): Promise<NftOrder> {
    const cartMeta = await this.userService.getCartMeta(session);
    if (typeof cartMeta === 'undefined') {
      throw Err(`createNftOrder err: cart should not be empty`);
    }
    if (typeof cartMeta.orderId !== 'undefined') {
      await this.cancelNftOrderId(cartMeta.orderId);
    }

    let nftOrderId: number;
    const orderAt = new Date();

    const tx = await this.conn.connect();
    try {
      tx.query('BEGIN');
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
SELECT order_id
FROM payment
WHERE payment_id = $1
      `,
      [paymentId],
    );
    return qryRes.rows[0].order_id;
  }

  async getOrderUserAddress(orderId: number): Promise<string> {
    const qryRes = await this.conn.query(
      `
SELECT user_address
FROM nft_order
JOIN kanvas_user
  ON kanvas_user.id = nft_order.user_id
WHERE nft_order.id = $1
      `,
      [orderId],
    );
    return qryRes.rows[0].user_address;
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
WHERE order_id = $1
RETURNING nft_id`,
      [orderId],
    );

    return nftIds.rows.map((row: any) => row.nft_id);
  }
}
