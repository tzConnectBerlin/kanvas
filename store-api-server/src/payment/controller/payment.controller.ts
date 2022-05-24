import {
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
  PaymentIntent,
  PaymentStatus,
  PaymentProvider,
} from '../../payment/service/payment.service.js';
import { UserEntity } from '../../user/entity/user.entity.js';
import { UserService } from '../../user/service/user.service.js';
import { BASE_CURRENCY } from 'kanvas-api-lib';
import { validateRequestedCurrency } from '../../paramUtils.js';

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
    @CurrentUser() user: UserEntity,
    @Body('currency') currency: string = BASE_CURRENCY,
  ): Promise<PaymentIntent> {
    Logger.log(`createPaymentIntent: ${JSON.stringify(currency)}`);

    validateRequestedCurrency(currency);

    let paymentProvider: PaymentProvider;
    if (currency === 'XTZ') {
      paymentProvider = PaymentProvider.TEZPAY;
    } else {
      paymentProvider = PaymentProvider.STRIPE;
    }

    try {
      return await this.paymentService.createPayment(
        user.id,
        paymentProvider,
        currency,
      );
    } catch (err: any) {
      Logger.error(err);
      throw new HttpException(
        'Unable to place the order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/status/:payment_id')
  @UseGuards(JwtAuthGuard)
  @Header('cache-control', 'no-store,must-revalidate')
  async getPaymentStatus(
    @CurrentUser() user: UserEntity,
    @Param('payment_id') paymentId: string,
  ): Promise<{ status: PaymentStatus }> {
    return {
      status: await this.paymentService.getPaymentStatus(user.id, paymentId),
    };
  }
}
