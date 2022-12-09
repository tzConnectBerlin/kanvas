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
import { PaymentService } from '../service/payment.service.js';
import { UserEntity } from '../../user/entity/user.types';
import { BASE_CURRENCY } from 'kanvas-api-lib';
import { PaymentIntent, PaymentProvider } from '../entity/payment.entity.js';
import { STRIPE_WEBHOOK_SECRET } from '../../constants.js';
import { UserService } from '../../user/service/user.service.js';

@Controller('payment')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private userService: UserService,
  ) {}

  /**
   * @apiGroup Payment
   * @api {post} /payment/stripe-webhook Stripe webhook, only to be called by Stripe
   * @apiHeader {String} stripe-signature Stripe signature, proving it was Stripe who called this endpoint
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
    if (typeof STRIPE_WEBHOOK_SECRET === 'undefined') {
      throw new HttpException(
        'stripe is not enabled in this kanvas instance',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }
    // Get the signature sent by Stripe
    let constructedEvent;

    try {
      constructedEvent =
        await this.paymentService.stripe.webhooks.constructEvent(
          request.body,
          signature,
          STRIPE_WEBHOOK_SECRET,
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
    } catch (err) {
      Logger.error(
        `err on processing stripe webhook call: ${JSON.stringify(err)}`,
      );
      throw new HttpException(
        'something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    throw new HttpException('', HttpStatus.NO_CONTENT);
  }

  /**
   * @apiGroup Payment
   * @api {post} /payment/create-payment-intent Create a payment intent
   * @apiDescription Checking out the cart involves creating a payment intent, which then has to be met (finalized) in the frontend application. For example, if paying with Stripe, the payment intent has to be finalized by applying Stripe's SDK in the frontend.
   *
   * The "clientSecret" in the response is the important piece that links the following finalization of the payment with the newly created payment intent.
   * @apiPermission logged-in user. The vatRate in the response is a range from 0 (0%) to 1 (100%)
   * @apiBody {String="tezpay","stripe","wert","simplex","test_provider"} [paymentProvider="stripe"] The payment provider used for the intent
   * @apiBody {String} [currency] The currency used for the payment intent, uses a base currency if not provided
   * @apiBody {Boolean} [recreateNftOrder=false] Will cancel an already pending NFT order if the user has one if set to true
   * @apiParamExample {json} Request Body Example:
   *    {
   *      currency: 'XTZ',
   *      paymentProvider: 'tezpay'
   *    }
   *
   * @apiSuccessExample Example Success-Response:
   *  {
   *    "id": "pi_3L2foUEdRDZNp7JF0yajTKrM",
   *    "amount": "0.66",
   *    "currency": "XTZ",
   *    "vatRate": 0.1,
   *    "amountExclVat": "0.55",
   *    "providerPaymentDetails": {
   *      "paypointMessage": "pi_3L2foUEdRDZNp7JF0yajTKrM_secret_cs3SWGJy7xdd5M19EwShCjbdE",
   *      "receiverAddress": "KT1..",
   *      "mutezAmount": "660000"
   *    }
   *  }
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
    return this.paymentService.handleCreatePaymentIntent({
      cookieSession,
      user,
      request,
      paymentProvider,
      currency,
      recreateNftOrder,
    });
  }

  /**
   * @apiGroup Payment
   * @api {post} /payment/order-now Add nft to cart and create payment intent for 2 payment providers
   * @apiDescription Checking out the cart involves creating a payment intent, which then has to be met (finalized) in the frontend application. For example, if paying with Stripe, the payment intent has to be finalized by applying Stripe's SDK in the frontend.
   * Note, this may fail if
   * - This NFT is not for sale (e.g. it's already sold out, or it's not yet released, or its no longer on sale)
   * - All remaining editions of this NFT are already in other active carts
   * - This NFT is already in the active cart (currently we only allow 1 edition per NFT per active cart)
   * - This NFT is a proxied NFT, it can only be claimed on purchase of the related Proxy NFT
   * - The user's cart is full (there is an environment variable defining the maximum allowed cart size)
   * - The NFT id does not exist
   *
   * The "clientSecret" in the response is the important piece that links the following finalization of the payment with the newly created payment intent.
   * @apiParam {Number} nftId The id of the NFT to add to the cart
   * @apiPermission logged-in user. The vatRate in the response is a range from 0 (0%) to 1 (100%)
   * @apiBody {String[]} paymentProviders=["stripe","tezpay"] The 2 payment providers used for the intent
   * @apiBody {String} [currency] The currency used for the stripe payment intent. Will default to a base currency if not provided. If base currency is XTZ, stripe will use USD.
   * @apiBody {Boolean} [recreateNftOrder=false] Will cancel an already pending NFT order if the user has one if set to true
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "paymentProviders": ['tezpay', 'stripe']
   *    }
   *
   * @apiSuccessExample Example Success-Response:
   *  {
   *    "tezpay": {
   *        "id": "pi_3L2foUEdRDZNp7JF0yajTKrM",
   *        "amount": "0.66",
   *        "currency": "XTZ",
   *        "vatRate": 0.1,
   *        "amountExclVat": "0.55",
   *        "providerPaymentDetails": {
   *          "paypointMessage": "pi_3L2foUEdRDZNp7JF0yajTKrM_secret_cs3SWGJy7xdd5M19EwShCjbdE",
   *          "receiverAddress": "KT1..",
   *          "mutezAmount": "660000"
   *        }
   *    },
   *    "stripe": {
   *        ...
   *    }
   *  }
   *  @apiExample {http} Example http request url (make sure to replace $base_url with the store-api-server endpoint):
   *  $base_url/payment/order-now/10
   * @apiName orderNow
   */
  @Post('/order-now/:id')
  @UseGuards(JwtAuthGuard)
  orderNow(
    @Session() cookieSession: any,
    @Req() request: any,
    @CurrentUser() user: UserEntity,
    @Param('nftId') nftId: number,
    @Body('paymentProviders') paymentProviders: PaymentProvider[],
    @Body('recreateNftOrder') recreateNftOrder: boolean = false,
    @Body('currency') currency: string = BASE_CURRENCY,
  ) {
    const [firstProvider, secondProvider] = paymentProviders.map((provider) => {
      return {
        provider,
        currency: this.paymentService.getCurrency(provider, currency),
      };
    });

    this.userService
      .handleCartAdd({ cookieSession, user, nftId })
      .then(async () => {
        const args = {
          cookieSession,
          user,
          request,
          recreateNftOrder,
        };
        const firstProviderIntent =
          await this.paymentService.handleCreatePaymentIntent({
            ...args,
            paymentProvider: firstProvider.provider,
            currency: firstProvider.currency,
          });
        const secondProviderIntent =
          await this.paymentService.handleCreatePaymentIntent({
            ...args,
            paymentProvider: secondProvider.provider,
            currency: secondProvider.currency,
          });
        return {
          [firstProvider.provider]: firstProviderIntent,
          [secondProvider.provider]: secondProviderIntent,
        };
      })
      .catch((err) => {
        Logger.error(
          `Unable to create payment intents for payment providers, err: ${err}`,
        );
        throw new HttpException(
          'failed to create payment intents for payment providers',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  /**
   * @apiGroup Payment
   * @api {post} /payment/promise-paid Inform promise paid
   * @apiDescription Informs the API that payment is made, allowing the API to communicate pro-actively to the user that it understands the payment should be finalized soon. Especially useful for payments made in tez, where it may take 2 minutes before the API acknowledges the payment successful
   * @apiPermission logged-in user
   * @apiBody {String} payment_id The payment id
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "payment_id": "some valid payment id (the id field in the response of /create-payment-intent"
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
        'something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @apiGroup Payment
   * @api {get} /payment/order-info/:paymentId Get order info via paymentId
   * @apiParam {Number} paymentId The id of one of the opened payment intents
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
      if (err instanceof HttpException) {
        throw err;
      }

      Logger.error(err);
      throw new HttpException(
        'failed to get order info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
