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
import {
  PaymentService,
  PaymentStatus,
} from '../../payment/service/payment.service.js';
import { UserEntity } from '../../user/entity/user.entity.js';
import { UserService } from '../../user/service/user.service.js';
import { BASE_CURRENCY } from 'kanvas-api-lib';
import { validateRequestedCurrency } from '../../paramUtils.js';
import { NftEntity } from '../../nft/entity/nft.entity.js';
import { PaymentProvider } from '../../payment/entity/payment.entity.js';

import type { PaymentIntent } from '../../payment/entity/payment.entity.js';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

@Controller('payment')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private userService: UserService,
  ) {}

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
    const { ip } = request;
    const clientIp = request.get('X-Forwarded-For') || ip;

    try {
      let paymentIntent = await this.paymentService.createPayment(
        user,
        cookieSession.uuid,
        paymentProvider,
        currency,
        recreateNftOrder,
        clientIp,
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
}
