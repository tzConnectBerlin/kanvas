import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  PG_CONNECTION,
  PAYPOINT_SCHEMA,
  PAYMENT_PROMISE_DEADLINE_MILLI_SECS,
  ORDER_EXPIRATION_MILLI_SECS,
} from '../../constants.js';
import { UserService } from '../../user/service/user.service.js';
import { NftService } from '../../nft/service/nft.service.js';
import { MintService } from '../../nft/service/mint.service.js';
import ts_results from 'ts-results';
const { Err } = ts_results;
import { Cron, CronExpression } from '@nestjs/schedule';
import { assertEnv, nowUtcWithOffset } from '../../utils.js';
import { DbTransaction, withTransaction, DbPool } from '../../db.module.js';
import Tezpay from 'tezpay-server';
import { v4 as uuidv4 } from 'uuid';
import {
  CurrencyService,
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
} from 'kanvas-api-lib';
import { createRequire } from 'module';
import { NftEntity } from '../../nft/entity/nft.entity.js';
const require = createRequire(import.meta.url);
const stripe = require('stripe');

export enum PaymentStatus {
  CREATED = 'created',
  PROMISED = 'promised',
  PROCESSING = 'processing',
  CANCELED = 'canceled',
  TIMED_OUT = 'timedOut',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum PaymentProvider {
  TEZPAY = 'tezpay',
  STRIPE = 'stripe',
  TEST = 'test_provider',
}

interface NftOrder {
  id: number;
  userId: number;
  orderAt: number;
  currency: string;
  currencyUnitAmount: number; // denoted in NftOrder.currency
  nfts: NftEntity[];
}

export interface PaymentIntent {
  amount: string;
  currency: string;
  clientSecret: string;
  id: string;
  receiverAddress?: string;
  nfts?: NftEntity[];
  expiresAt?: number;
}

@Injectable()
export class PaymentService {
  stripe = process.env.STRIPE_SECRET
    ? stripe(process.env.STRIPE_SECRET)
    : undefined;

  FINAL_STATES = [
    PaymentStatus.FAILED,
    PaymentStatus.SUCCEEDED,
    PaymentStatus.CANCELED,
    PaymentStatus.TIMED_OUT,
  ];

  tezpay: any;

  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private readonly mintService: MintService,
    private readonly userService: UserService,
    private readonly nftService: NftService,
    private readonly currencyService: CurrencyService,
  ) {
    this.tezpay = new Tezpay({
      paypoint_schema_name: PAYPOINT_SCHEMA,
      db_pool: conn,
      block_confirmations: 2,
    });
  }

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

    await this.#updatePaymentStatus(
      constructedEvent.data.object.id,
      paymentStatus,
    );
  }

  async promisePaid(userId: number, paymentId: string) {
    return await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const qryRes = await dbTx.query(
        `
UPDATE payment
SET
  expires_at = greatest($3, expires_at),
  status = 'promised'
WHERE payment_id = $2
  AND status = 'created'
  AND EXISTS (
    SELECT 1
    FROM nft_order
    WHERE nft_order.id = payment.nft_order_id
      AND user_id = $1
  )`,
        [
          userId,
          paymentId,
          nowUtcWithOffset(PAYMENT_PROMISE_DEADLINE_MILLI_SECS),
        ],
      );
      if (qryRes.rowCount === 0) {
        throw new HttpException(
          `logged in user (id=${userId}) does not have an unfinished payment with payment_id=${paymentId} that hasn't been promised payment yet`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const orderId = await this.getPaymentOrderId(paymentId, dbTx);
      await this.userService.dropCartByOrderId(orderId, dbTx);
    });
  }

  async getPaymentNfts(
    userId: number,
    paymentId: string,
  ): Promise<{ currency: string; nfts: NftEntity[]; expiresAt: number }> {
    const orderNftsQryRes = await this.conn.query(
      `
SELECT
  payment.expires_at,
  nft_order.currency,
  mtm.nft_id,
  mtm.price
FROM payment
JOIN mtm_nft_order_nft AS mtm
  ON mtm.nft_order_id = payment.nft_order_id
JOIN nft_order
  ON nft_order.id = payment.nft_order_id
WHERE user_id = $1
  AND payment.payment_id = $2
      `,
      [userId, paymentId],
    );
    const expiresAt: number = orderNftsQryRes.rows[0]['expires_at'];
    const nfts = await this.nftService.findByIds(
      orderNftsQryRes.rows.map((row: any) => row['nft_id']),
    );

    return {
      currency: BASE_CURRENCY,
      nfts: nfts,
      expiresAt: expiresAt,
    };
  }

  async getPaymentStatus(
    userId: number,
    paymentId: string,
  ): Promise<PaymentStatus> {
    const qryRes = await this.conn.query(
      `
SELECT
  payment.status
FROM payment
JOIN nft_order
  ON nft_order.id = payment.nft_order_id
WHERE user_id = $1
  AND payment.payment_id = $2
      `,
      [userId, paymentId],
    );

    if (qryRes.rowCount === 0) {
      throw new HttpException(
        `logged in user does not have a payment with payment_id=${paymentId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return qryRes.rows[0]['status'];
  }

  async createPayment(
    userId: number,
    paymentProvider: PaymentProvider,
    currency: string,
  ): Promise<PaymentIntent> {
    return await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const preparedOrder = await this.#createOrder(
        dbTx,
        userId,
        paymentProvider,
        currency,
      );
      let paymentIntent = await this.#createPaymentIntent(
        preparedOrder.currencyUnitAmount,
        paymentProvider,
        currency,
      );
      await this.#registerPayment(
        dbTx,
        paymentProvider,
        paymentIntent.id,
        preparedOrder.id,
      );
      return paymentIntent;
    }).catch((err: any) => {
      Logger.error(`Err on creating nft order (userId=${userId}, err: ${err}`);
      throw err;
    });
  }

  async #createOrder(
    dbTx: DbTransaction,
    userId: number,
    provider: PaymentProvider,
    currency: string,
  ): Promise<NftOrder> {
    const cartSessionRes = await this.userService.getUserCartSession(
      userId,
      dbTx,
    );
    if (!cartSessionRes.ok || typeof cartSessionRes.val !== 'string') {
      throw 'cannot create an order, no active cart session';
    }
    const cartSession: string = cartSessionRes.val;

    const cartMeta = await this.userService.getCartMeta(cartSession, dbTx);
    if (typeof cartMeta === 'undefined') {
      throw Err(`registerOrder err: cart should not be empty`);
    }

    try {
      if (
        typeof cartMeta.orderId !== 'undefined' &&
        (await this.#nftOrderHasPaymentEntry(cartMeta.orderId, dbTx))
      ) {
        await this.cancelNftOrderId(dbTx, cartMeta.orderId);
      }

      const orderAt = new Date();

      const orderQryRes = await dbTx.query(
        `
INSERT INTO nft_order (
  user_id, order_at, currency
)
VALUES ($1, $2, $3)
RETURNING id`,
        [userId, orderAt.toUTCString(), currency],
      );
      const nftOrderId: number = orderQryRes.rows[0]['id'];

      const cart = await this.userService.cartList(
        cartSession,
        currency,
        true,
        dbTx,
      );
      if (cart.nfts.length === 0) {
        throw 'cannot create an order from an empty cart';
      }
      const currencyUnitAmount = cart.nfts.reduce(
        (sum, nft) => sum + Number(nft.price),
        0,
      );

      for (const nft of cart.nfts) {
        await dbTx.query(
          `
INSERT INTO mtm_nft_order_nft (
  nft_order_id, nft_id, price
)
VALUES ($1, $2, $3)
        `,
          [nftOrderId, nft.id, nft.price],
        );
      }

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
        currency: currency,
        currencyUnitAmount: currencyUnitAmount,
        nfts: cart.nfts,
      };
    } catch (err: any) {
      Logger.error(
        `Err on creating order in db (provider=${provider}, cartSessionId=${cartMeta.id}, err: ${err}`,
      );
      throw err;
    }
  }

  async #createPaymentIntent(
    baseUnitAmount: number,
    paymentProvider: PaymentProvider,
    currency: string,
  ): Promise<PaymentIntent> {
    switch (paymentProvider) {
      case PaymentProvider.TEZPAY:
        return await this.#createTezPaymentIntent(baseUnitAmount);
      case PaymentProvider.STRIPE:
        return await this.#createStripePaymentIntent(baseUnitAmount, currency);
      case PaymentProvider.TEST:
        return {
          amount: baseUnitAmount.toFixed(0),
          currency: currency,
          clientSecret: '..',
          id: `stripe_test_id${new Date().getTime().toString()}`,
        };
    }
  }

  async #createStripePaymentIntent(
    currencyUnitAmount: number,
    currency: string,
  ): Promise<PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: currencyUnitAmount,
      currency: currency,
      automatic_payment_methods: {
        enabled: false,
      },
    });

    const decimals = SUPPORTED_CURRENCIES[currency];
    return {
      amount: (Number(currencyUnitAmount) * Math.pow(10, -decimals)).toFixed(
        decimals,
      ),
      currency: currency,
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    };
  }

  async #createTezPaymentIntent(mutezAmount: number): Promise<PaymentIntent> {
    const id = uuidv4();
    const tezpayIntent = await this.tezpay.init_payment({
      external_id: id,
      mutez_amount: mutezAmount,
    });
    return {
      amount: mutezAmount.toFixed(0),
      currency: 'XTZ',
      clientSecret: tezpayIntent.message,
      id,
      receiverAddress: tezpayIntent.receiver_address,
    };
  }

  async #registerPayment(
    dbTx: DbTransaction,
    provider: PaymentProvider,
    paymentId: string,
    nftOrderId: number,
  ) {
    try {
      const expireAt = nowUtcWithOffset(ORDER_EXPIRATION_MILLI_SECS);
      await dbTx.query(
        `
INSERT INTO payment (
  payment_id, status, nft_order_id, provider, expires_at
)
VALUES ($1, 'created', $2, $3, $4)
RETURNING id`,
        [paymentId, nftOrderId, provider, expireAt],
      );
    } catch (err: any) {
      Logger.error(
        `Err on storing payment intent in db (provider=${provider}, paymentId=${paymentId}, nftOrderId=${nftOrderId}), err: ${err}`,
      );
      throw err;
    }
  }

  async #updatePaymentStatus(paymentId: string, newStatus: PaymentStatus) {
    const prevStatus = await withTransaction(
      this.conn,
      async (dbTx: DbTransaction) => {
        const qryPrevStatus = await dbTx.query(
          `
SELECT status
FROM payment
WHERE payment_id = $1
        `,
          [paymentId],
        );
        if (qryPrevStatus.rowCount === 0) {
          throw `Cannot update payment status of unknown paymentId=${paymentId} (attempted new status was: ${newStatus})`;
        }
        const prevStatus = qryPrevStatus.rows[0]['status'];

        await dbTx.query(
          `
UPDATE payment
SET status = $1
WHERE payment_id = $2
  AND NOT status = ANY($3)
        `,
          [newStatus, paymentId, this.FINAL_STATES],
        );

        if (newStatus === PaymentStatus.PROCESSING) {
          const orderId = await this.getPaymentOrderId(paymentId, dbTx);
          await this.userService.dropCartByOrderId(orderId, dbTx);
        }

        return prevStatus;
      },
    ).catch((err: any) => {
      Logger.error(
        `Err on updating payment status in db (paymentId=${paymentId}, newStatus=${newStatus}), err: ${err}`,
      );
      throw err;
    });

    Logger.log(`Payment with id=${paymentId}: ${prevStatus}->${newStatus}`);

    if (
      newStatus === PaymentStatus.SUCCEEDED &&
      !this.FINAL_STATES.includes(prevStatus)
    ) {
      const orderId = await this.getPaymentOrderId(paymentId);
      await this.#orderCheckout(orderId);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async deleteExpiredPayments() {
    const cancelOrderIds = await this.conn.query(
      `
SELECT
  nft_order_id,
  expires_at
FROM payment
WHERE expires_at <= now() AT TIME ZONE 'UTC'
  AND status IN ('created', 'promised')
    `,
    );

    for (const row of cancelOrderIds.rows) {
      const orderId = Number(row['nft_order_id']);
      await withTransaction(this.conn, async (dbTx: DbTransaction) => {
        await this.cancelNftOrderId(dbTx, orderId, PaymentStatus.TIMED_OUT);
        Logger.warn(`canceled following expired order session: ${orderId}`);
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPendingTezpays() {
    const pendingPaymentIds = await this.conn.query(
      `
SELECT
  payment_id
FROM payment
WHERE provider = 'tezpay'
  AND status IN ('created', 'promised')
    `,
    );

    for (const row of pendingPaymentIds.rows) {
      const paymentId = row['payment_id'];
      const paymentStatus = await this.tezpay.get_payment(paymentId);

      if (paymentStatus.is_paid_in_full) {
        await this.#updatePaymentStatus(paymentId, PaymentStatus.SUCCEEDED);
        Logger.log(`tezpay succeeded. payment_id=${paymentId}`);
      }
    }
  }

  async cancelNftOrderId(
    dbTx: DbTransaction,
    orderId: number,
    newStatus:
      | PaymentStatus.CANCELED
      | PaymentStatus.TIMED_OUT = PaymentStatus.CANCELED,
  ) {
    const payment = await dbTx.query(
      `
UPDATE payment
SET status = $2
WHERE nft_order_id = $1
AND status IN ('created', 'promised', 'timedOut')
RETURNING payment_id, provider
      `,
      [orderId, newStatus],
    );

    if (payment.rowCount === 0) {
      throw Err(
        `paymentIntentCancel failed (orderId=${orderId}), err: no payment exists with matching orderId and cancellable status`,
      );
    }

    const provider = payment.rows[0]['provider'];
    const paymentId = payment.rows[0]['payment_id'];

    try {
      switch (provider) {
        case PaymentProvider.STRIPE:
          await this.stripe.paymentIntents.cancel(paymentId);
          break;
        case PaymentProvider.TEZPAY:
          await this.tezpay.cancel_payment(paymentId);
          break;
      }
    } catch (err: any) {
      throw Err(
        `Err on canceling nft order (orderId=${orderId}, provider=${provider}), err: ${err}`,
      );
    }
  }

  async getPaymentOrderId(
    paymentId: string,
    dbTx: DbTransaction | DbPool = this.conn,
  ): Promise<number> {
    const qryRes = await dbTx.query(
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

  async #orderCheckout(orderId: number) {
    await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      const userAddress = await this.getOrderUserAddress(orderId);

      const nftIds = await this.#assignOrderNftsToUser(dbTx, orderId);
      if (nftIds.length === 0) {
        return false;
      }
      const nfts = await this.nftService.findByIds(nftIds);

      // Don't await results of the transfers. Finish the checkout, any issues
      // should be solved asynchronously to the checkout process itself.
      this.mintService.transfer_nfts(nfts, userAddress);

      await this.userService.dropCartByOrderId(orderId, dbTx);
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
  async getPaymentForLatestUserOrder(
    userId: number,
  ): Promise<{ paymentId: string; orderId: number; status: PaymentStatus }> {
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
      paymentId: qryRes.rows[0]['payment_id'],
      orderId: qryRes.rows[0]['order_id'],
      status: qryRes.rows[0]['status'],
    };
  }
}
