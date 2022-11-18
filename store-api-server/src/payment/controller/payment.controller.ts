import {
  Session,
  Controller,
  HttpException,
  Post,
  Get,
  Req,
  Param,
  Body,
  Headers,
  HttpStatus,
  UseGuards,
  Logger,
  Header,
} from '@nestjs/common';
import { CurrentUser } from '../../decoraters/user.decorator.js';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard.js';
import { PaymentService } from "../service/payment.service";
import { UserEntity } from '../../user/entity/user.entity.js';
import { BASE_CURRENCY } from 'kanvas-api-lib';
import { validateRequestedCurrency } from '../../paramUtils.js';
import { PaymentProvider } from "../entity/payment.entity";

import type { PaymentIntent } from "../entity/payment.entity";
import { getClientIp } from '../../utils.js';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  /**
   * @apiGroup Payment
   * @api {post} /payment/stripe-webhook Stripe webhook
   * @apiHeader {String} stripe-signature Stripe signature
   * @apiHeaderExample {json} Header-Example:
   *     {
   *      "stripe-signature": "a valid stripe signature"
   *     }
   * @apiName stripeWebhook
   */
  @Post('/stripe-webhook')
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: any,
  ) {
    if (!endpointSecret) {
      throw new HttpException('Stripe not enabled', HttpStatus.BAD_REQUEST);
    }
    // Get the signature sent by Stripe
    let constructedEvent;

    try {
      constructedEvent =
        await this.paymentService.stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret,
        );
    } catch (err) {
      Logger.error(`Err on payment webhook signature verification: ${err}`);
      throw new HttpException(
        'Webhook signature verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.paymentService.webhookHandler(constructedEvent);
    } catch (error) {
      new HttpException('', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    throw new HttpException('', HttpStatus.NO_CONTENT);
  }

  /**
   * @apiGroup Payment
   * @api {post} /payment/create-payment-intent Create a payment intent
   * @apiPermission logged-in user
   * @apiBody {String="tezpay","stripe","wert","simplex","test_provider"} [paymentProvider="stripe"] The payment provider used for the intent
   * @apiBody {String} [currency] The currency used for the payment intent, uses a base currency if not provided
   * @apiBody {Boolean} [recreateNftOrder=false] Will cancel nft order if set to true
   * @apiParamExample {json} Request Body Example:
   *    {
   *      currency: 'XTZ',
   *      paymentProvider: 'tezpay'
   *    }
   * @apiName createPaymentIntent
   */
  @Post('/create-payment-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity,
    @Req() request: any,
    @Body('paymentProvider')
    paymentProvider: PaymentProvider = PaymentProvider.STRIPE,
    @Body('currency') currency: string = BASE_CURRENCY,
    @Body('recreateNftOrder') recreateNftOrder: boolean = false,
  ): Promise<PaymentIntent> {
    validateRequestedCurrency(currency);
    if (
      paymentProvider === PaymentProvider.TEST ||
      !Object.values(PaymentProvider).includes(paymentProvider)
    ) {
      throw new HttpException(
        `requested payment provider not available`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (currency === 'XTZ') {
      // temporary for backwards compatibility, until frontend has been updated
      paymentProvider = PaymentProvider.TEZPAY;
    }
    const clientIp = getClientIp(request);

    try {
      let paymentIntent = await this.paymentService.createPayment(
        user,
        cookieSession.uuid,
        paymentProvider,
        currency,
        clientIp,
        recreateNftOrder,
      );
      const order = await this.paymentService.getPaymentOrder(paymentIntent.id);

      let resp = {
        ...paymentIntent,
        nfts: order.nfts,
        expiresAt: order.expiresAt,
      };
      return resp;
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      Logger.error(err);
      throw new HttpException(
        'Unable to place the order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @apiGroup Payment
   * @api {post} /payment/promise-paid Inform promise paid
   * @apiDescription Informs the API that payment is made
   * @apiPermission logged-in user
   * @apiBody {String} payment_id The payment id
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "payment_id": "some valid payment id"
   *    }
   * @apiName promisePaymentPaid
   */
  @Post('/promise-paid')
  @UseGuards(JwtAuthGuard)
  async promisePaymentPaid(
    @CurrentUser() user: UserEntity,
    @Body('payment_id') paymentId: string,
  ) {
    try {
      await this.paymentService.promisePaid(user.id, paymentId);
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }

      Logger.error(err);
      throw new HttpException(
        `logged in user (id=${user.id}) does not have an unfinished payment with payment_id=${paymentId} that hasn't been promised payment yet`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * @apiGroup Payment
   * @api {get} /payment/order-info/:paymentId Get order info via paymentId
   * @apiParam {Number} paymentId The id of the nft
   * @apiPermission logged-in user
   * @apiExample {http} Example http request url (make sure to replace $base_url with the store-api-server endpoint):
   *  $base_url/payment/order-info/12345678910
   * @apiName getNftOrder
   */
  @Get('/order-info/:paymentId')
  @UseGuards(JwtAuthGuard)
  @Header('cache-control', 'no-store,must-revalidate')
  async getNftOrder(
    @CurrentUser() usr: UserEntity,
    @Param('paymentId') paymentId: string,
  ) {
    try {
      return await this.paymentService.getOrderInfo(usr, paymentId);
    } catch (err) {
      Logger.error(err);
      throw new HttpException(
        'failed to get order info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
