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
  WERT_PRIV_KEY,
  WERT_PUB_KEY,
  WERT_ALLOWED_FIAT,
  TEZPAY_PAYPOINT_ADDRESS,
  SIMPLEX_API_KEY,
  SIMPLEX_API_URL,
  SIMPLEX_PUBLIC_KEY,
  SIMPLEX_WALLET_ID,
  SIMPLEX_ALLOWED_FIAT,
  STRIPE_PAYMENT_METHODS,
  STRIPE_SECRET,
} from '../../constants.js';
import { UserService } from '../../user/service/user.service.js';
import { NftService } from '../../nft/service/nft.service.js';
import { MintService } from '../../nft/service/mint.service.js';
import ts_results from 'ts-results';
const { Err } = ts_results;
import { Cron, CronExpression } from '@nestjs/schedule';
import { assertEnv, nowUtcWithOffset, isBottom } from '../../utils.js';
import { DbTransaction, withTransaction, DbPool } from '../../db.module.js';
import Tezpay from 'tezpay-server';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { UserEntity } from '../../user/entity/user.entity.js';
import {
  CurrencyService,
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
} from 'kanvas-api-lib';
import { signSmartContractData } from '@wert-io/widget-sc-signer';
import { createRequire } from 'module';
import { PaymentProvider } from '../entity/payment.entity.js';

import type { NftEntity } from '../../nft/entity/nft.entity.js';
import type {
  TezpayDetails,
  StripeDetails,
  WertDetails,
  SimplexDetails,
} from '../entity/payment.entity.js';

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

export interface NftOrder {
  id: number;
  userId: number;
  userAddress: string;
  nfts: NftEntity[];
  expiresAt: number;
}

export interface PaymentIntentInternal {
  id: string;

  amount: string;
  currency: string;
  paymentDetails?: StripeDetails | WertDetails | TezpayDetails | SimplexDetails;
}

@Injectable()
export class PaymentService {
  stripe = STRIPE_SECRET ? stripe(STRIPE_SECRET) : undefined;

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

    await this.updatePaymentStatus(
      constructedEvent.data.object.id,
      paymentStatus,
    );
  }

  async promisePaid(userId: number, paymentId: string) {
    const order = await this.getPaymentOrder(paymentId);
    if (order.userId !== userId) {
      throw `user (id=${userId}) not allowed to promise payment paid for order of other user (id=${order.userId})`;
    }

    try {
      await this.updatePaymentStatus(paymentId, PaymentStatus.PROMISED);
    } catch (err: any) {
      Logger.warn(`failed to update status to promised, err: ${err}`);
      return;
    }

    await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      await dbTx.query(
        `
UPDATE nft_order
SET expires_at = greatest($2, expires_at)
WHERE id = $1
      `,
        [order.id, nowUtcWithOffset(PAYMENT_PROMISE_DEADLINE_MILLI_SECS)],
      );

      await this.userService.dropCartByOrderId(order.id, dbTx);
    });
  }

  async createPayment(
    usr: UserEntity,
    cookieSession: string,
    provider: PaymentProvider,
    currency: string,
    clientIp: string,
    recreateOrder: boolean = false,
  ): Promise<PaymentIntentInternal> {
    await this.userService.ensureUserCartSession(usr.id, cookieSession);

    return await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      // set isolation level to the most strict setting of postgres,
      // this ensures there are no race conditions with a single user executing
      // createPayment in quick succession.
      dbTx.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

      const orderId = await this.#createOrder(dbTx, usr.id, recreateOrder);

      let requestCurrency = currency;
      if (provider === PaymentProvider.WERT) {
        requestCurrency = 'XTZ';
      }

      const order = await this.#getOrder(orderId, requestCurrency, true, dbTx);

      const currencyUnitAmount: number = order.nfts.reduce(
        (sum, nft) => sum + Number(nft.price),
        0,
      );
      let paymentIntent = await this.#createPaymentIntent(
        provider,
        usr.userAddress,
        currency,
        currencyUnitAmount,
        usr,
        clientIp,
      );
      await this.#registerPayment(
        dbTx,
        orderId,
        paymentIntent.id,
        provider,
        currency,
        Number(paymentIntent.amount),
      );

      return paymentIntent;
    }).catch((err: any) => {
      throw `Err on creating nft order (userId=${usr.id}), err: ${err}`;
    });
  }

  async #createOrder(
    dbTx: DbTransaction,
    userId: number,
    recreateOrder: boolean,
  ): Promise<number> {
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
      throw `cannot create order for userId=${userId} (cartSession=${cartSession}), empty cart`;
    }

    if (!isBottom(cartMeta.orderId)) {
      if (!recreateOrder) {
        return cartMeta.orderId!;
      }

      await this.cancelNftOrder(dbTx, cartMeta.orderId!);
    }

    const orderAt = new Date();
    const expireAt = nowUtcWithOffset(ORDER_EXPIRATION_MILLI_SECS);
    const orderQryRes = await dbTx.query(
      `
INSERT INTO nft_order (
  user_id, order_at, expires_at
)
VALUES ($1, $2, $3)
RETURNING id`,
      [userId, orderAt.toUTCString(), expireAt],
    );
    const nftOrderId: number = orderQryRes.rows[0]['id'];

    const orderNftsQry = await dbTx.query(
      `
INSERT INTO mtm_nft_order_nft (nft_order_id, nft_id)
SELECT $2, cart.nft_id
FROM mtm_cart_session_nft AS cart
WHERE cart_session_id = $1
        `,
      [cartMeta.id, nftOrderId],
    );
    if (orderNftsQry.rowCount === 0) {
      throw `cannot create order for userId=${userId} (cartSession=${cartSession}), empty cart`;
    }

    await dbTx.query(
      `
UPDATE cart_session
SET order_id = $2
WHERE id = $1
        `,
      [cartMeta.id, nftOrderId],
    );

    return nftOrderId;
  }

  async #getOrder(
    orderId: number,
    currency: string = BASE_CURRENCY,
    inBaseUnit: boolean = false,
    dbTx: DbTransaction | DbPool = this.conn,
  ): Promise<NftOrder> {
    const qryRes = await dbTx.query(
      `
SELECT
  usr.id AS user_id,
  usr.address AS user_address,
  nft_order.expires_at,
  mtm.nft_id
FROM nft_order
JOIN kanvas_user AS usr
  ON usr.id = nft_order.user_id
JOIN mtm_nft_order_nft AS mtm
  ON mtm.nft_order_id = nft_order.id
WHERE nft_order.id = $1
      `,
      [orderId],
    );

    if (qryRes.rowCount === 0) {
      throw `no nft_order found with id=${orderId}`;
    }

    return {
      id: orderId,
      userId: qryRes.rows[0]['user_id'],
      userAddress: qryRes.rows[0]['user_address'],
      expiresAt: qryRes.rows[0]['expires_at'].getTime(),
      nfts: await this.nftService.findByIds(
        qryRes.rows.map((row: any) => row['nft_id']),
        undefined,
        'nft_id',
        'asc',
        currency,
        inBaseUnit,
      ),
    };
  }

  async getPaymentOrder(paymentId: string): Promise<NftOrder> {
    const orderId = await this.getPaymentOrderId(paymentId);
    return await this.#getOrder(orderId);
  }

  async #createPaymentIntent(
    provider: PaymentProvider,
    userAddress: string,
    currency: string,
    currencyUnitAmount: number,
    usr: UserEntity,
    clientIp: string,
  ): Promise<PaymentIntentInternal> {
    switch (provider) {
      case PaymentProvider.TEZPAY:
        if (currency !== 'XTZ') {
          throw new HttpException(
            `currency (${currency}) is not supported for tezpay`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return await this.#createTezPaymentIntent(currencyUnitAmount);
      case PaymentProvider.STRIPE:
        return await this.#createStripePaymentIntent(
          usr,
          currency,
          currencyUnitAmount,
        );
      case PaymentProvider.WERT:
        return await this.#createWertPaymentIntent(
          userAddress,
          currency,
          currencyUnitAmount,
        );
      case PaymentProvider.SIMPLEX:
        return await this.#createSimplexPaymentIntent(
          currency,
          currencyUnitAmount,
          usr,
          clientIp,
        );
      case PaymentProvider.TEST:
        return {
          amount: currencyUnitAmount.toFixed(0),
          currency: currency,
          id: `stripe_test_id${new Date().getTime().toString()}`,
        };
    }
  }

  async #createWertPaymentIntent(
    userAddress: string,
    fiatCurrency: string,
    mutezAmount: number,
  ): Promise<PaymentIntentInternal> {
    if (
      typeof WERT_PRIV_KEY === 'undefined' ||
      typeof TEZPAY_PAYPOINT_ADDRESS === 'undefined'
    ) {
      throw new HttpException(
        'Wert payment provider not supported by this API instance',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    if (!WERT_ALLOWED_FIAT.includes(fiatCurrency)) {
      throw new HttpException(
        `requested fiat (${fiatCurrency}) is not supported by Wert`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const tezpayIntent = await this.#createTezPaymentIntent(mutezAmount);
    const tezpayDetails = <TezpayDetails>tezpayIntent.paymentDetails;

    const decimals = SUPPORTED_CURRENCIES['XTZ'];
    const tezAmount = Number(
      (tezpayDetails.mutezAmount * Math.pow(10, -decimals)).toFixed(decimals),
    );
    const signedData = signSmartContractData(
      {
        address: userAddress,
        commodity: 'XTZ',
        commodity_amount: tezAmount,
        pk_id: 'key1',
        sc_id: new Buffer(tezpayDetails.paypointMessage).toString('hex'),
        sc_address: TEZPAY_PAYPOINT_ADDRESS,
        sc_input_data: new Buffer(`{
            "entrypoint": "pay",
            "value": {"string":"${tezpayDetails.paypointMessage}"}
          }`).toString('hex'),
      },
      WERT_PRIV_KEY,
    );

    return {
      id: tezpayIntent.id,
      amount: this.currencyService.convertToCurrency(
        this.currencyService.convertFromCurrency(tezAmount, 'XTZ'),
        fiatCurrency,
      ),
      currency: fiatCurrency,
      paymentDetails: {
        wertData: {
          ...signedData,
          currency: fiatCurrency,
        },
      },
    };
  }

  async #createSimplexPaymentIntent(
    fiatCurrency: string,
    currencyUnitAmount: number,
    usr: UserEntity,
    clientIp: string,
  ): Promise<PaymentIntentInternal> {
    if (
      typeof SIMPLEX_API_URL === 'undefined' ||
      typeof SIMPLEX_API_KEY === 'undefined' ||
      typeof SIMPLEX_WALLET_ID === 'undefined'
    ) {
      throw new HttpException(
        'Simplex payment provider not supported by this API instance',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    if (!SIMPLEX_ALLOWED_FIAT.includes(fiatCurrency)) {
      throw new HttpException(
        `requested fiat (${fiatCurrency}) is not supported by Simplex`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const decimals = SUPPORTED_CURRENCIES[fiatCurrency];
    const amount = (
      Number(currencyUnitAmount) * Math.pow(10, -decimals)
    ).toFixed(decimals);
    async function getSimplexQuoteId() {
      try {
        let quoteResponse = await axios.post(
          SIMPLEX_API_URL + '/wallet/merchant/v2/quote',
          {
            end_user_id: '' + usr.id,
            digital_currency: 'USD-DEPOSIT',
            fiat_currency: 'USD',
            requested_currency: 'USD',
            requested_amount: Number(amount),
            wallet_id: SIMPLEX_WALLET_ID,
            client_ip: '1.2.3.4', // TODO ?
            payment_methods: ['credit_card'],
          },
          {
            headers: {
              Authorization: `ApiKey ${SIMPLEX_API_KEY}`,
            },
          },
        );
        return quoteResponse.data?.quote_id;
      } catch (error) {
        let errorMessage;
        if (error instanceof Error) {
          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response?.data?.error || error.response?.data;
            let errors = error.response?.data?.errors;
            if (errors && typeof errors == 'object') {
              errorMessage =
                error.response?.data?.error +
                '---DETAILS:---' +
                JSON.stringify(errors);
            }
            Logger.warn('get quote ERROR' + errorMessage);
            throw new Error(
              `there is problem simplex api get quote please contact your backend services`,
            );
          } else {
            Logger.warn(
              'Unexpected error simplex api get quote instance of error',
              error.message,
            );
          }
        } else {
          Logger.warn('Unexpected error simplex api get quote');
        }
        throw new Error(
          `there is problem simplex api get quote please contact your backend services`,
        );
      }
    }
    let quoteId = await getSimplexQuoteId();

    const paymentId = uuidv4();
    const orderId = uuidv4();

    async function simplexPaymentRequest() {
      try {
        var paymentResponse = await axios.post(
          SIMPLEX_API_URL + '/wallet/merchant/v2/payments/partner/data',
          {
            account_details: {
              app_provider_id: SIMPLEX_WALLET_ID,
              app_version_id: '1.0.0',
              app_end_user_id: '' + usr.id,
              app_install_date: usr.createdAt
                ? new Date(usr.createdAt * 1000).toISOString()
                : new Date().toISOString(),
              email: '', // TODO NO WAY ?
              phone: '', // TODO NO WAY ?
              signup_login: {
                timestamp: new Date().toISOString(),
                ip: clientIp,
              },
            },
            transaction_details: {
              payment_details: {
                quote_id: quoteId,
                payment_id: paymentId,
                order_id: orderId,
                destination_wallet: {
                  currency: 'USD-DEPOSIT',
                  address: usr.userAddress,
                  tag: '',
                },
                original_http_ref_url: '', // TODO NO WAY ?
              },
            },
          },
          {
            headers: {
              Authorization: `ApiKey ${SIMPLEX_API_KEY}`,
            },
          },
        );
      } catch (error) {
        let errorMessage;
        if (error instanceof Error) {
          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response?.data?.error || error.response?.data;
            let errors = error.response?.data?.errors;
            if (errors && typeof errors == 'object') {
              errorMessage =
                error.response?.data?.error +
                '---DETAILS:---' +
                JSON.stringify(errors);
            }
            Logger.warn('payment req ERROR' + errorMessage);
            throw new Error(
              `there is problem simplex api payment req please contact your backend services`,
            );
          } else {
            Logger.warn(
              'Unexpected error simplex api get quote instance of error',
              error.message,
            );
          }
        } else {
          Logger.warn('Unexpected error simplex api payment req');
        }
        throw new Error(
          `there is problem simplex api payment req please contact your backend services`,
        );
      }
      return paymentResponse;
    }

    let paymentResponse = await simplexPaymentRequest();

    if (!paymentResponse.data?.is_kyc_update_required) {
      throw new Error(
        `there is problem simplex api payment req please contact your backend services (payment req succeeded but response unsupported)`,
      );
    }

    return {
      id: paymentId,
      amount: amount,
      currency: fiatCurrency,
      paymentDetails: {
        simplexData: {
          paymentId: paymentId,
          orderId: orderId,
          publicApiKey: SIMPLEX_PUBLIC_KEY,
        },
      },
    };
  }

  async #createStripePaymentIntent(
    usr: UserEntity,
    currency: string,
    currencyUnitAmount: number,
  ): Promise<PaymentIntentInternal> {
    if (typeof this.stripe === 'undefined') {
      throw new HttpException(
        'stripe payment provider not supported by this API instance',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    if (currency === 'XTZ') {
      throw new HttpException(
        'currency (XTZ) is not supported for stripe',
        HttpStatus.BAD_REQUEST,
      );
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: currencyUnitAmount,
      currency: currency,
      payment_method_types: STRIPE_PAYMENT_METHODS,
    });

    const decimals = SUPPORTED_CURRENCIES[currency];
    return {
      id: paymentIntent.id,
      amount: currencyUnitAmount.toFixed(0),
      currency: currency,
      paymentDetails: {
        clientSecret: paymentIntent.client_secret,
      },
    };
  }

  async #createTezPaymentIntent(
    mutezAmount: number,
  ): Promise<PaymentIntentInternal> {
    const id = uuidv4();
    const tezpayIntent = await this.tezpay.init_payment({
      external_id: id,
      mutez_amount: mutezAmount,
    });
    const decimals = SUPPORTED_CURRENCIES['XTZ'];
    return {
      id,
      amount: (Number(mutezAmount) * Math.pow(10, -decimals)).toFixed(decimals),
      currency: 'XTZ',
      paymentDetails: {
        receiverAddress: tezpayIntent.receiver_address,
        paypointMessage: tezpayIntent.message,
        mutezAmount: mutezAmount,
      },
    };
  }

  async #registerPayment(
    dbTx: DbTransaction,
    nftOrderId: number,
    paymentId: string,
    provider: PaymentProvider,
    currency: string,
    currencyUnitAmount: number,
  ) {
    try {
      if (await this.#orderHasProviderOpen(nftOrderId, provider)) {
        await this.cancelNftOrderPayment(dbTx, nftOrderId, provider);
      }
      await dbTx.query(
        `
INSERT INTO payment (
  payment_id, status, nft_order_id, provider, currency, amount
)
VALUES ($1, 'created', $2, $3, $4, $5)
RETURNING id`,
        [paymentId, nftOrderId, provider, currency, currencyUnitAmount],
      );
    } catch (err: any) {
      Logger.error(
        `Err on storing payment intent in db (provider=${provider}, paymentId=${paymentId}, nftOrderId=${nftOrderId}), err: ${err}`,
      );
      throw err;
    }
  }

  async #orderHasProviderOpen(
    orderId: number,
    provider: PaymentProvider,
    dbTx: DbTransaction | DbPool = this.conn,
  ): Promise<boolean> {
    const qryRes = await dbTx.query(
      `
SELECT 1
FROM payment
WHERE nft_order_id = $1
  AND provider = $2
  AND NOT status = ANY($3)
      `,
      [orderId, provider, this.FINAL_STATES],
    );

    return qryRes.rowCount > 0;
  }

  async updatePaymentStatus(
    paymentId: string,
    newStatus: PaymentStatus,
    async_finalize = true,
  ) {
    const prevStatus = await withTransaction(
      this.conn,
      async (dbTx: DbTransaction) => {
        dbTx.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

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

        this.#assertStatusTransitionAllowed(prevStatus, newStatus);

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
      const finalize = (async () => {
        const orderId = await this.getPaymentOrderId(paymentId);
        await this.#orderCheckout(orderId);

        // cancel other payment intents (if any)
        await withTransaction(this.conn, async (dbTx: DbTransaction) => {
          await this.cancelNftOrder(dbTx, orderId);
        });
      })();
      if (!async_finalize) {
        await finalize;
      }
    }
  }

  #assertStatusTransitionAllowed(
    prevStatus: PaymentStatus,
    newStatus: PaymentStatus,
  ) {
    if (
      newStatus === PaymentStatus.PROMISED &&
      prevStatus !== PaymentStatus.CREATED
    ) {
      throw `Cannot update status to promised from ${prevStatus}`;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async deleteExpiredPayments() {
    const cancelOrderIds = await this.conn.query(
      `
SELECT
  nft_order.id AS nft_order_id,
  nft_order.expires_at,
  payment.provider
FROM nft_order
JOIN payment
  ON payment.nft_order_id = nft_order.id
WHERE nft_order.expires_at <= now() AT TIME ZONE 'UTC'
  AND payment.status IN ('created', 'promised')
    `,
    );

    for (const row of cancelOrderIds.rows) {
      const orderId = Number(row['nft_order_id']);
      const provider = row['provider'];
      await withTransaction(this.conn, async (dbTx: DbTransaction) => {
        await this.cancelNftOrderPayment(
          dbTx,
          orderId,
          provider,
          PaymentStatus.TIMED_OUT,
        );
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
WHERE provider IN ('tezpay', 'wert')
  AND status IN ('created', 'promised')
    `,
    );

    for (const row of pendingPaymentIds.rows) {
      const paymentId = row['payment_id'];
      const paymentStatus = await this.tezpay.get_payment(paymentId);

      if (paymentStatus.is_paid_in_full) {
        await this.updatePaymentStatus(paymentId, PaymentStatus.SUCCEEDED);
        Logger.log(`tezpay succeeded. payment_id=${paymentId}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPendingSimplex() {
    Logger.log('getSimplexEvents START');
    const pendingPaymentIds = await this.conn.query(
      `
SELECT
  payment_id
FROM payment
WHERE provider = 'simplex'
  AND status IN ('created', 'promised')
    `,
    );
    if (pendingPaymentIds.rowCount === 0) {
      return;
    }

    async function getSimplexEvents() {
      try {
        let eventsResponse = await axios.get(
          SIMPLEX_API_URL + '/wallet/merchant/v2/events',
          {
            headers: {
              Authorization: `ApiKey ${SIMPLEX_API_KEY}`,
            },
          },
        );
        return eventsResponse.data;
      } catch (error) {
        let errorMessage;
        if (error instanceof Error) {
          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response?.data?.error || error.response?.data;
            let errors = error.response?.data?.errors;
            if (errors && typeof errors == 'object') {
              errorMessage =
                error.response?.data?.error +
                '---DETAILS:---' +
                JSON.stringify(errors);
            }
            Logger.warn('getSimplexEvents ERROR' + errorMessage);
            throw new Error(
              `there is problem simplex api getSimplexEvents please contact your backend services`,
            );
          } else {
            Logger.warn(
              'Unexpected error simplex api getSimplexEvents instance of error',
              error.message,
            );
          }
        } else {
          Logger.warn('Unexpected error simplex api getSimplexEvents');
        }
        throw new Error(
          `there is problem simplex api getSimplexEvents please contact your backend services`,
        );
      }
    }

    async function deleteSimplexEvents(eventId: string) {
      try {
        let eventsResponse = await axios.delete(
          SIMPLEX_API_URL + '/wallet/merchant/v2/events/' + eventId,
          {
            headers: {
              Authorization: `ApiKey ${SIMPLEX_API_KEY}`,
            },
          },
        );
        return eventsResponse.data;
      } catch (error) {
        let errorMessage;
        if (error instanceof Error) {
          if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response?.data?.error || error.response?.data;
            let errors = error.response?.data?.errors;
            if (errors && typeof errors == 'object') {
              errorMessage =
                error.response?.data?.error +
                '---DETAILS:---' +
                JSON.stringify(errors);
            }
            Logger.warn('getSimplexEvents ERROR' + errorMessage);
          } else {
            Logger.warn(
              'Unexpected error simplex api deleteSimplexEvents instance of error',
              error.message,
            );
          }
        } else {
          Logger.warn('Unexpected error simplex api deleteSimplexEvents');
        }
      }
    }

    function getSimplexPaymentStatus(event: { name: any }) {
      let paymentStatus: PaymentStatus;
      switch (event?.name) {
        case 'payment_simplexcc_approved':
          paymentStatus = PaymentStatus.SUCCEEDED;
          break;
        case 'payment_simplexcc_declined':
          paymentStatus = PaymentStatus.FAILED;
          break;
        default:
          Logger.error(`Unhandled payment status ${event?.name}`);
          throw Err('Unknown simplex events');
      }
      return paymentStatus;
    }

    let eventsResponse = await getSimplexEvents();
    for (const row of pendingPaymentIds.rows) {
      const paymentId = row['payment_id'];

      let events = eventsResponse?.events?.filter(
        (item: { payment: { id: string } }) => {
          return item?.payment?.id == paymentId;
        },
      );

      let event = events.pop();

      if (!event) {
        Logger.warn(
          'isPaidSimplex there is no event for paymentId: ' + paymentId,
        );
        throw Err('there is no simplex event');
      }

      const paymentStatus = getSimplexPaymentStatus(event);

      await this.updatePaymentStatus(paymentId, paymentStatus);
      Logger.log(
        `simplex payment ended. payment_id=${paymentId} paymentStatus:${paymentStatus}`,
      );

      events.push(event);
      for (const event1 of events) {
        let deleteResponse = await deleteSimplexEvents(event1.event_id);
        if (deleteResponse?.status == 'OK') {
          Logger.log(
            `simplex payment DELETE event succeeded. eventId=${event1.event_id} paymentId=${paymentId}`,
          );
        } else {
          Logger.warn(
            `simplex payment DELETE event failed. eventId=${event1.event_id} paymentId=${paymentId}`,
          );
        }
      }
    }
    Logger.log('getSimplexEvents FINISH successfully');
  }

  async cancelNftOrder(
    dbTx: DbTransaction,
    orderId: number,
    newStatus:
      | PaymentStatus.CANCELED
      | PaymentStatus.TIMED_OUT = PaymentStatus.CANCELED,
  ) {
    const openPaymentsQryResp = await dbTx.query(
      `
SELECT provider
FROM payment
WHERE nft_order_id = $1
  AND status IN ('created', 'promised', 'timedOut', 'processing')
      `,
      [orderId],
    );

    await Promise.all(
      openPaymentsQryResp.rows.map((row) =>
        this.cancelNftOrderPayment(dbTx, orderId, row['provider'], newStatus),
      ),
    );
  }

  async cancelNftOrderPayment(
    dbTx: DbTransaction,
    orderId: number,
    provider: PaymentProvider,
    newStatus:
      | PaymentStatus.CANCELED
      | PaymentStatus.TIMED_OUT = PaymentStatus.CANCELED,
  ) {
    const payment = await dbTx.query(
      `
UPDATE payment
SET status = $3
WHERE nft_order_id = $1
  AND provider = $2
  AND NOT status = ANY($4)
RETURNING payment_id
      `,
      [orderId, provider, newStatus, this.FINAL_STATES],
    );

    if (payment.rowCount === 0) {
      throw Err(
        `paymentIntentCancel failed (orderId=${orderId}), err: no payment exists with matching orderId and cancellable status`,
      );
    }

    const paymentId = payment.rows[0]['payment_id'];

    try {
      switch (provider) {
        // we could not add SIMPLEX. Because Simplex Team does not support cancel payment.
        case PaymentProvider.STRIPE:
          await this.stripe.paymentIntents.cancel(paymentId);
          break;
        case PaymentProvider.TEZPAY:
        case PaymentProvider.WERT:
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

  async #orderCheckout(orderId: number) {
    const order = await this.#getOrder(orderId);

    await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      await this.#assignOrderNftsToUser(dbTx, orderId);

      // Don't await results of the transfers. Finish the checkout, any issues
      // should be solved asynchronously to the checkout process itself.
      this.mintService.transfer_nfts(order.nfts, order.userAddress);

      await this.userService.dropCartByOrderId(orderId, dbTx);
    }).catch((err: any) => {
      Logger.error(
        `failed to checkout order (orderId=${orderId}), err: ${err}`,
      );
      throw err;
    });
  }

  async #assignOrderNftsToUser(dbTx: any, orderId: number) {
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
`,
      [orderId],
    );
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
