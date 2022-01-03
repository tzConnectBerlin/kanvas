import {
  Controller,
  HttpException,
  Post,
  Req,
  Headers,
  HttpStatus,
  UseGuards,
  Session,
  Logger
} from '@nestjs/common';
import { CurrentUser } from 'src/decoraters/user.decorator';
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';
import { PaymentService, PaymentStatus, StripePaymentIntent } from 'src/payment/service/payment.service';
import { UserService } from 'src/user/service/user.service';
import { UserEntity } from 'src/user/entity/user.entity';

const stripe = require("stripe")(process.env.STRIPE_SECRET);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

@Controller('payment')
export class PaymentController {
  constructor(private userService: UserService, private paymentService: PaymentService) { }

  @Post('/stripe-webhook')
  async stripeWebhook(@Headers('stripe-signature') signature: string, @Req() request: any) {
    if (!endpointSecret) {
      throw new HttpException('Stripe not enabled', HttpStatus.BAD_REQUEST);
    }
    // Get the signature sent by Stripe
    let constructedEvent;

    try {
      constructedEvent = await stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );

    } catch (err) {
      throw new HttpException(
        'Webhook signature verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    let paymentStatus: PaymentStatus;

    switch (constructedEvent.type) {
      case 'payment_intent.succeeded':
        paymentStatus = PaymentStatus.SUCCEEDED
        break;
      case 'payment_intent.processing':
        paymentStatus = PaymentStatus.PROCESSING
        break;
      case 'payment_intent.canceled':
        paymentStatus = PaymentStatus.CANCELED
        console.log('cancelled')
        break;
      case 'payment_intent.payment_failed':
        paymentStatus = PaymentStatus.FAILED
        break;
      default:
        Logger.error(`Unhandled event type ${constructedEvent.type}`);
        throw new HttpException('', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    await this.paymentService.editPaymentStatus(paymentStatus, constructedEvent.data.object.id)

    throw new HttpException('', HttpStatus.NO_CONTENT);
  }

  @Post('/create-payment-intent')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity,
  ) : Promise<StripePaymentIntent> {
    // const createStripePayment (cookieSession, user)
    const stripePaymentIntent = this.paymentService.createStripePayment(cookieSession, user)
      .catch((err: any) => {
        Logger.error(err)
        throw new HttpException(
          'Unable to place the order',
          HttpStatus.BAD_REQUEST,
        );
      })

    return stripePaymentIntent
  }
}
