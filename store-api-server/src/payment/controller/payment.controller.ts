import {
  Controller,
  HttpException,
  Post,
  Req,
  Body,
  Headers,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { CurrentUser } from 'src/decoraters/user.decorator';
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';
import {
  PaymentService,
  PaymentIntent,
  PaymentProvider,
} from 'src/payment/service/payment.service';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/service/user.service';
import { BASE_CURRENCY } from 'kanvas-api-lib';
import { validateRequestedCurrency } from 'src/paramUtils';

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
    @Body() currency: string = BASE_CURRENCY,
  ): Promise<PaymentIntent> {
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
}
