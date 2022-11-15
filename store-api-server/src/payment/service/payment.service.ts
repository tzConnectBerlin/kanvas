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
import {
  nowUtcWithOffset,
  isBottom,
  maybe,
  stringEnumValueIndex,
  stringEnumIndexValue,
} from '../../utils.js';
import {
  DbTransaction,
  withTransaction,
  withMutexLock,
  DbPool,
} from '../../db.module.js';
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
import {
  PaymentProvider,
  PaymentStatus,
  OrderInfo,
  OrderStatus,
  NftDeliveryInfo,
  NftDeliveryStatus,
} from '../entity/payment.entity.js';

import type { NftEntity } from '../../nft/entity/nft.entity.js';
import type {
  TezpayDetails,
  StripeDetails,
  WertDetails,
  SimplexDetails,
} from '../entity/payment.entity.js';

const require = createRequire(import.meta.url);
const stripe = require('stripe');

export interface NftOrder {
  id: number;
  userId: number;
  userAddress: string;
  nfts: NftEntity[];
  expiresAt: number;
}

export interface PaymentIntentInternal {
  id: string;

  currency: string;
  amount: string;
  amountExclVat: string;
  vatRate: number;

  provider: PaymentProvider;
  paymentDetails?: StripeDetails | WertDetails | TezpayDetails | SimplexDetails;
}

@Injectable()
export class PaymentService {
  stripe = STRIPE_SECRET ? stripe(STRIPE_SECRET) : undefined;

  FINAL_STATES = [
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
      let paymentStatus;

      try {
        paymentStatus = await this.getPaymentStatus(paymentId);
      } catch (_) {
        throw err;
      }
      if (
        ![PaymentStatus.PROCESSING, PaymentStatus.SUCCEEDED].includes(
          paymentStatus,
        )
      ) {
        throw err;
      }

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

      const order = await this.#getOrder(orderId, currency, true, dbTx);

      const amountUnit: number = order.nfts.reduce(
        (sum, nft) => sum + Number(nft.price),
        0,
      );

      let paymentIntent = await this.#createPaymentIntent(
        usr,
        provider,
        currency,
        amountUnit,
        clientIp,
      );
      await this.#registerPayment(dbTx, orderId, paymentIntent);

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

  async getOrderInfo(usr: UserEntity, paymentId: string): Promise<OrderInfo> {
    const orderId = await this.getPaymentOrderId(paymentId);

    const [order, intents] = await Promise.all([
      this.#getOrder(orderId),
      this.#getOrderPaymentIntents(orderId),
    ]);

    if (order.userId !== usr.id) {
      throw new Error(
        'user does not have any orders with given payment intent identifier',
      );
    }

    const paymentStatus = this.furthestPaymentStatus(
      intents.map((intent) => intent.status),
    );

    let orderStatus: OrderStatus;
    let delivery: { [key: number]: NftDeliveryInfo } | undefined;
    switch (paymentStatus) {
      case PaymentStatus.CANCELED:
      case PaymentStatus.TIMED_OUT:
        orderStatus = OrderStatus.CANCELED;
        break;
      case PaymentStatus.FAILED:
      case PaymentStatus.CREATED:
      case PaymentStatus.PROMISED:
      case PaymentStatus.PROCESSING:
        orderStatus = OrderStatus.PENDING_PAYMENT;
        break;
      case PaymentStatus.SUCCEEDED:
        delivery = await this.#getOrderDeliveryInfo(order);

        orderStatus = OrderStatus.DELIVERED;
        if (
          Object.values(delivery).some(
            (nftDelivery) => nftDelivery.status !== NftDeliveryStatus.DELIVERED,
          )
        ) {
          orderStatus = OrderStatus.DELIVERING;
        }
        break;
      default:
        throw new Error(
          `failed to determin order status (order id=${orderId}): unknown furthest payment status ${paymentStatus}`,
        );
    }

    return <OrderInfo>{
      orderedNfts: order.nfts,
      paymentIntents: intents,
      orderStatus: orderStatus,
      delivery,
    };
  }

  async #getOrderDeliveryInfo(
    order: NftOrder,
  ): Promise<{ [key: number]: NftDeliveryInfo }> {
    const res: { [key: number]: NftDeliveryInfo } = {};
    for (const row of (
      await this.conn.query(
        `
SELECT
  order_nft_id,
  transfer_nft_id,
  op.state,
  op.included_in
FROM nft_order_delivery
LEFT JOIN peppermint.operations AS op
  ON op.id = transfer_operation_id
WHERE nft_order_id = $1
  AND order_nft_id = ANY($2)
      `,
        [order.id, order.nfts.map((nft) => nft.id)],
      )
    ).rows) {
      res[row['order_nft_id']] = {
        status: this.#peppermintStateToDeliveryStatus(row['state']),
        transferOpHash: maybe(row['included_in'], (x) => x),
        proxiedNft:
          row['transfer_nft_id'] !== row['order_nft_id']
            ? await this.nftService.byId(row['transfer_nft_id'])
            : undefined,
      };
    }
    return res;
  }

  async #getOrderPaymentIntents(
    orderId: number,
  ): Promise<
    [{ paymentId: string; provider: PaymentProvider; status: PaymentStatus }]
  > {
    return (
      await this.conn.query(
        `
SELECT
  payment_id,
  provider,
  status
FROM payment
WHERE nft_order_id = $1
      `,
        [orderId],
      )
    ).rows.map((row: any) => {
      return {
        paymentId: row['payment_id'],
        provider: row['provider'],
        status: row['status'],
      };
    });
  }

  async #createPaymentIntent(
    usr: UserEntity,
    provider: PaymentProvider,
    currency: string,
    amountUnit: number,
    clientIp: string,
  ): Promise<PaymentIntentInternal> {
    const vatRate = await this.#getVatRate(clientIp);

    let amount = this.currencyService
      .convertFromBaseUnit(currency, amountUnit)
      .toFixed(0);

    const id = uuidv4();
    return {
      id,

      currency,
      amount,
      amountExclVat: this.currencyService.toFixedDecimals(
        currency,
        Number(amount) - Number(amount) / (1 + vatRate),
      ),
      vatRate,

      provider,
      paymentDetails: await this.#createPaymentDetails(
        id,
        usr,
        provider,
        currency,
        amountUnit,
        clientIp,
      ),
    };
  }

  async #createPaymentDetails(
    paymentId: string,
    usr: UserEntity,
    provider: PaymentProvider,
    currency: string,
    amountUnit: number,
    clientIp: string,
  ) {
    switch (provider) {
      case PaymentProvider.TEZPAY:
        if (currency !== 'XTZ') {
          throw new HttpException(
            `currency (${currency}) is not supported for tezpay`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return await this.#createTezPaymentDetails(paymentId, amountUnit);
      case PaymentProvider.STRIPE:
        return await this.#createStripePaymentDetails(currency, amountUnit);
      case PaymentProvider.WERT:
        const fiatCurrency = currency;

        // Always require receival of XTZ for WERT payments (Fiat is sent to
        // WERT by the customer, WERT then calls _our_ paypoint smart contract,
        // which finalizes the payment with the sent equivalent XTZ value to
        // us)
        const mutezAmount = Number(
          this.currencyService.convertToCurrency(
            this.currencyService.convertFromCurrency(
              this.currencyService.convertFromBaseUnit(currency, amountUnit),
              currency,
            ),
            'XTZ',
            true,
          ),
        );

        return await this.#createWertPaymentDetails(
          paymentId,
          usr.userAddress,
          fiatCurrency,
          mutezAmount,
        );
      case PaymentProvider.SIMPLEX:
        return await this.#createSimplexPaymentDetails(
          usr,
          currency,
          amountUnit,
          clientIp,
        );
      case PaymentProvider.TEST:
        return undefined;
    }
  }

  async #createWertPaymentDetails(
    paymentId: string,
    userAddress: string,
    fiatCurrency: string,
    mutezAmount: number,
  ): Promise<WertDetails> {
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

    const tezpayDetails = await this.#createTezPaymentDetails(
      paymentId,
      mutezAmount,
    );

    const signedData = signSmartContractData(
      {
        address: userAddress,
        commodity: 'XTZ',
        commodity_amount: this.currencyService.convertFromBaseUnit(
          'XTZ',
          mutezAmount,
        ),
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
      wertData: {
        ...signedData,
        currency: fiatCurrency,
      },
    };
  }

  async #createSimplexPaymentDetails(
    usr: UserEntity,
    fiatCurrency: string,
    amountUnit: number,
    clientIp: string,
  ): Promise<SimplexDetails> {
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
    const amount = (Number(amountUnit) * Math.pow(10, -decimals)).toFixed(
      decimals,
    );
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
            client_ip: clientIp,
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
      simplexData: {
        paymentId: paymentId,
        orderId: orderId,
        publicApiKey: SIMPLEX_PUBLIC_KEY,
      },
    };
  }

  async #createStripePaymentDetails(
    currency: string,
    currencyUnitAmount: number,
  ): Promise<StripeDetails> {
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

    return {
      clientSecret: paymentIntent.client_secret,
      amount: currencyUnitAmount.toFixed(0),
    };
  }

  async #createTezPaymentDetails(
    paymentId: string,
    mutezAmount: number,
  ): Promise<TezpayDetails> {
    const tezpayIntent = await this.tezpay.init_payment({
      external_id: paymentId,
      mutez_amount: mutezAmount,
    });
    return {
      receiverAddress: tezpayIntent.receiver_address,
      paypointMessage: tezpayIntent.message,
      mutezAmount: mutezAmount,
    };
  }

  async #registerPayment(
    dbTx: DbTransaction,
    nftOrderId: number,
    paymentIntent: PaymentIntentInternal,
  ) {
    try {
      if (
        await this.#orderHasProviderOpen(nftOrderId, paymentIntent.provider)
      ) {
        await this.cancelNftOrderPayment(
          dbTx,
          nftOrderId,
          paymentIntent.provider,
        );
      }
      await dbTx.query(
        `
INSERT INTO payment (
  payment_id, status, nft_order_id, provider, currency, amount, vat_rate, amount_excl_vat
)
VALUES ($1, 'created', $2, $3, $4, $5, $6, $7)
RETURNING id`,
        [
          paymentIntent.id,
          nftOrderId,
          paymentIntent.provider,
          paymentIntent.currency,
          paymentIntent.amount,
          paymentIntent.vatRate,
          paymentIntent.amountExclVat,
        ],
      );
    } catch (err: any) {
      Logger.error(
        `Err on storing payment intent in db (provider=${paymentIntent.provider}, paymentId=${paymentIntent.id}, nftOrderId=${nftOrderId}), err: ${err}`,
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
      throw `Err on updating payment status in db (paymentId=${paymentId}, newStatus=${newStatus}), err: ${err}`;
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
      [...this.FINAL_STATES, PaymentStatus.PROCESSING].includes(prevStatus)
    ) {
      throw `Cannot update status to promised from ${prevStatus}`;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async deleteExpiredPayments() {
    await withMutexLock({
      mutexName: 'deleteExpiredPayments',
      dbPool: this.conn,
      onLockedReturn: null,
      f: async (dbTx: DbTransaction) => {
        const cancelOrderIds = await dbTx.query(
          `
SELECT
  nft_order.id AS nft_order_id,
  nft_order.expires_at,
  payment.provider
FROM nft_order
JOIN payment
  ON payment.nft_order_id = nft_order.id
WHERE nft_order.expires_at <= now() AT TIME ZONE 'UTC'
  AND payment.status IN ('created', 'promised', 'failed')
ORDER BY 1
    `,
        );

        for (const row of cancelOrderIds.rows) {
          const orderId = Number(row['nft_order_id']);
          const provider = row['provider'];
          await this.cancelNftOrderPayment(
            dbTx,
            orderId,
            provider,
            PaymentStatus.TIMED_OUT,
          );
          await dbTx.query('SAVEPOINT s');
          Logger.warn(`canceled following expired order session: ${orderId}`);
        }
      },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPendingTezpays() {
    await withMutexLock({
      mutexName: 'checkPendingTezpays',
      dbPool: this.conn,
      onLockedReturn: null,
      f: async () => {
        const pendingPaymentIds = await this.conn.query(
          `
SELECT
  payment_id
FROM payment
WHERE provider IN ('tezpay', 'wert')
  AND status IN ('created', 'promised')
ORDER BY 1
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
      },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPendingSimplex() {
    await withMutexLock({
      mutexName: 'checkPendingSimplex',
      dbPool: this.conn,
      onLockedReturn: null,
      f: async () => {
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
                errorMessage =
                  error.response?.data?.error || error.response?.data;
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
                errorMessage =
                  error.response?.data?.error || error.response?.data;
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
      },
    });
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
  AND NOT status = ANY($2)
      `,
      [orderId, this.FINAL_STATES],
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

  async getPaymentStatus(
    paymentId: string,
    dbTx: DbTransaction | DbPool = this.conn,
  ): Promise<PaymentStatus> {
    const qryRes = await dbTx.query(
      `
SELECT status
FROM payment
WHERE payment_id = $1
      `,
      [paymentId],
    );
    return qryRes.rows[0]['status'];
  }

  async #orderCheckout(orderId: number) {
    const order = await this.#getOrder(orderId);
    const nfts = await withTransaction(
      this.conn,
      async (dbTx: DbTransaction) => {
        const nfts = await this.#unfoldProxyNfts(dbTx, order.nfts);

        await this.#assignNftsToUser(
          dbTx,
          order.userId,
          Object.values(nfts).map((nft: NftEntity) => nft.id),
        );

        return nfts;
      },
    ).catch((err: any) => {
      Logger.error(
        `failed to checkout order (orderId=${orderId}), err: ${err}`,
      );
      throw err;
    });
    this.userService.dropCartByOrderId(orderId);

    // This step is done after committing the database related assigning of the
    // NFTs to the user, if any issues occur with Blockchain related assigning
    // they should be resolved asynchronously
    const opIds = await this.mintService.transferNfts(
      Object.values(nfts),
      order.userAddress,
    );
    await this.#registerTransfers(orderId, nfts, opIds);
  }

  async #registerTransfers(
    orderId: number,
    nfts: { [key: number]: NftEntity },
    opIds: { [key: number]: number },
  ) {
    await withTransaction(this.conn, async (dbTx: DbTransaction) => {
      for (const orderedNftId of Object.keys(nfts).map(Number)) {
        const transferNft = nfts[orderedNftId];
        let transferOpId = opIds[transferNft.id];

        await dbTx.query(
          `
INSERT INTO nft_order_delivery (
  nft_order_id, order_nft_id, transfer_operation_id, transfer_nft_id
)
VALUES ($1, $2, $3, $4)
          `,
          [orderId, orderedNftId, transferOpId, transferNft.id],
        );
      }
    });
  }

  async #unfoldProxyNfts(
    dbTx: DbTransaction,
    nfts: NftEntity[],
  ): Promise<{ [key: number]: NftEntity }> {
    await dbTx.query('LOCK TABLE proxy_unfold IN EXCLUSIVE MODE');

    const res: { [key: number]: NftEntity } = {};
    for (const nft of nfts) {
      if (!nft.isProxy) {
        res[nft.id] = nft;
        continue;
      }

      const unfoldId = (
        await dbTx.query(
          `
UPDATE proxy_unfold
SET claimed = true
WHERE proxy_nft_id = $1
  AND NOT claimed
  AND id = (
    SELECT min(id)
    FROM proxy_unfold
    WHERE proxy_nft_id = $1
      AND NOT claimed
  )
RETURNING unfold_nft_id
        `,
          [nft.id],
        )
      ).rows[0]['unfold_nft_id'];

      res[nft.id] = await this.nftService.byId(unfoldId);
    }
    return res;
  }

  async #assignNftsToUser(dbTx: any, userId: number, nftIds: number[]) {
    await dbTx.query(
      `
INSERT INTO mtm_kanvas_user_nft (
  kanvas_user_id, nft_id
)
SELECT $1, UNNEST($2::int[])
`,
      [userId, nftIds],
    );
  }

  // Test function
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

  #peppermintStateToDeliveryStatus(state: string): NftDeliveryStatus {
    switch (state) {
      case 'pending':
        return NftDeliveryStatus.INITIATING;
      case 'processing':
      case 'waiting':
        return NftDeliveryStatus.DELIVERING;
      case 'confirmed':
        return NftDeliveryStatus.DELIVERED;
      case 'unknown':
      case 'rejected':
      case 'failed':
      case 'lost':
      case 'canary':
        return NftDeliveryStatus.UNKNOWN;
      default:
        throw new Error(
          `could not determine nft delivery status: unknown peppermint state ${state}`,
        );
    }
  }

  furthestPaymentStatus(statuses: PaymentStatus[]): PaymentStatus | undefined {
    return stringEnumIndexValue(
      PaymentStatus,
      Math.max(
        ...statuses.map(
          (status) => stringEnumValueIndex(PaymentStatus, status) ?? 0,
        ),
      ),
    );
  }

  // Note: returned value is a rate between 0 and 1 (with 1 translating to 100%)
  async #getVatRate(ipAddr: string): Promise<number> {
    const ip: number = this.ipAddrToNum(ipAddr);

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
      [ip],
    );

    if (isBottom(qryRes.rows.at[0]?.['country_id'])) {
      Logger.warn(
        `Unmapped country for ip address ${ipAddr} (ip in numeric format: ${ip}`,
      );
      return 0;
    }

    return qryRes.rows[0]['rate'] / 100;
  }

  ipAddrToNum(ip: string): number {
    const ipParts = ip.split('.');
    return (
      ((+ipParts[0] * 256 + +ipParts[1]) * 256 + +ipParts[2]) * 256 +
      +ipParts[3]
    );
  }
}
