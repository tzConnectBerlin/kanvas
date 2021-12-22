require('dotenv').config();
import {
  Session,
  HttpException,
  HttpStatus,
  Body,
  Param,
  Headers,
  Req,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  Get,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserEntity } from '../entity/user.entity';
import { PaymentStatus, UserService } from '../service/user.service';
import { CurrentUser } from '../../decoraters/user.decorator';
import {
  JwtAuthGuard,
  JwtFailableAuthGuard,
} from '../../authentication/guards/jwt-auth.guard';
import {
  PG_UNIQUE_VIOLATION_ERRCODE,
  PG_FOREIGN_KEY_VIOLATION_ERRCODE,
  PROFILE_PICTURE_MAX_BYTES,
} from '../../constants';
import { assertEnv } from 'src/utils';

interface EditProfile {
  userName?: string;
}

const stripe = require("stripe")(assertEnv('STRIPE_SECRET'));
const endpointSecret = assertEnv('STRIPE_WEBHOOK_SECRET')

@Controller('users')
export class UserController {
  constructor(private userService: UserService) { }

  @Get('/profile')
  @UseGuards(JwtFailableAuthGuard)
  async getProfile(
    @CurrentUser() user?: UserEntity,
    @Query('userAddress') userAddress?: string,
  ) {
    const address =
      userAddress ||
      (typeof user !== 'undefined' ? user.userAddress : undefined);
    if (typeof address === 'undefined') {
      throw new HttpException(
        'Define userAddress parameter or access this endpoint logged in',
        HttpStatus.BAD_REQUEST,
      );
    }

    const profile_res = await this.userService.getProfile(address);
    if (!profile_res.ok) {
      if (typeof userAddress === 'undefined') {
        throw new HttpException(
          'Failed to find user associated to JWT',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'No user registered with requested userAddress',
        HttpStatus.BAD_REQUEST,
      );
    }
    return profile_res.val;
  }

  @Post('/profile/edit')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: { fileSize: PROFILE_PICTURE_MAX_BYTES },
    }),
  )
  async editProfile(
    @CurrentUser() currentUser: UserEntity,
    @Body() editFields: EditProfile,
    @UploadedFile() picture: any,
  ) {
    console.log(editFields);
    try {
      await this.userService.edit(
        currentUser.id,
        editFields?.userName,
        picture,
      );
    } catch (err: any) {
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        throw new HttpException(
          'This username is already taken',
          HttpStatus.BAD_REQUEST,
        );
      }

      Logger.warn(err);
      throw new HttpException(
        'Failed to edit profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/stripe-webhook')
  async stripeWebhook(@Headers('stripe-signature') signature: string, @Req() request: any) {
    if (endpointSecret) {
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

      switch (constructedEvent.type) {
        case 'payment_intent.succeeded':
          const paymentIntentSucceeded = constructedEvent.data.object;
          await this.userService.editPaymentStatus(PaymentStatus.SUCCEEDED, paymentIntentSucceeded.id)
          console.log('payment_intent.succeeded')
          // Mint or transfer the token ...

          break;
        case 'payment_intent.processing':
          const paymentIntentProcessing = constructedEvent.data.object;
          await this.userService.editPaymentStatus(PaymentStatus.PROCESSING, paymentIntentProcessing.id)
          break;
        case 'payment_intent.canceled':
          const paymentIntentCanceled = constructedEvent.data.object;
          await this.userService.editPaymentStatus(PaymentStatus.CANCELED, paymentIntentCanceled.id)

          break;
        case 'payment_intent.payment_failed':
          const paymentIntentPaymentFailed = constructedEvent.data.object;
          await this.userService.editPaymentStatus(PaymentStatus.FAILED, paymentIntentPaymentFailed.id)
          console.log('payment_intent.payment_failed')

          break;
        default:
          console.log(`Unhandled event type ${constructedEvent.type}`);
      }
    }

    throw new HttpException('', HttpStatus.NO_CONTENT);
  }

  @Post('/create-payment-intent')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity,
  ) {

    const cartSession = await this.getCartSession(cookieSession, user);

    const cartList = await this.userService.cartList(cartSession)
    const amount = cartList.nfts.reduce((sum, nft) => sum + nft.price, 0)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "eur", // Have to change this to handle different currencies
      automatic_payment_methods: {
        enabled: false,
      },
    });

    const nftOrder = await this.userService.createNftOrder(cartSession, user.id)
      .catch(err => {
        console.log(err)
        throw new HttpException(
          err.val,
          HttpStatus.BAD_REQUEST,
        );
      })

    await this.userService.createPayment(paymentIntent.id, nftOrder.id, 'stripe')

    return { clientSecret: paymentIntent.client_secret }
  }

  @Get('/profile/edit/check')
  @UseGuards(JwtAuthGuard)
  async checkAllowedEdit(@Query('userName') userName: string) {
    const available = await this.userService.isNameAvailable(userName);
    return {
      userName: userName,
      available: available,
    };
  }

  @Post('cart/add/:nftId')
  @UseGuards(JwtFailableAuthGuard)
  async cartAdd(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
    @Param('nftId') nftId: number,
  ) {
    const cartSession = await this.getCartSession(cookieSession, user);
    const cartLocked = await this.userService.isCartLocked(cartSession);
    if (cartLocked) {
      throw new HttpException(
        'No actions allowed on this cart',
        HttpStatus.BAD_REQUEST,
      );
    }

    const addedRes = await this.userService
      .cartAdd(cartSession, nftId)
      .catch((err: any) => {
        if (err?.code === PG_FOREIGN_KEY_VIOLATION_ERRCODE) {
          throw new HttpException(
            'This nft does not exist',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
          throw new HttpException(
            'This nft is already in the cart',
            HttpStatus.BAD_REQUEST,
          );
        }

        Logger.error(
          `Error on adding nft to cart. cartSession=${cartSession}, nftId=${nftId}, err: ${err}`,
        );
        throw new HttpException(
          'Something went wrong',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });

    if (!addedRes.ok) {
      throw new HttpException(addedRes.val, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('cart/remove/:nftId')
  @UseGuards(JwtFailableAuthGuard)
  async cartRemove(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
    @Param('nftId') nftId: number,
  ) {
    const cartSession = await this.getCartSession(cookieSession, user);
    const cartLocked = await this.userService.isCartLocked(cartSession);
    if (cartLocked) {
      throw new HttpException(
        'No actions allowed on this cart',
        HttpStatus.BAD_REQUEST,
      );
    }

    const removed = await this.userService.cartRemove(cartSession, nftId);
    if (!removed) {
      throw new HttpException(
        'This nft was not in the cart',
        HttpStatus.BAD_REQUEST,
      );
    }
    // return 204 (successful delete, returning nothing)
    throw new HttpException('', HttpStatus.ACCEPTED);
  }

  @Post('cart/list')
  @UseGuards(JwtFailableAuthGuard)
  async cartList(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
  ) {
    const cartSession = await this.getCartSession(cookieSession, user);
    return await this.userService.cartList(cartSession);
  }

  // To verify
  @Post('cart/lock/:willLock')
  @UseGuards(JwtFailableAuthGuard)
  async cartValidate(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity,
    @Param('willLock') willLock: boolean,
  ) {
    const cartSession = await this.getCartSession(cookieSession, user);
    return await this.userService.cartLock(willLock, cartSession);
  }

  @Post('cart/checkout')
  @UseGuards(JwtAuthGuard)
  async cartCheckout(@CurrentUser() user: UserEntity) {
    const cartSessionRes = await this.userService.getUserCartSession(user.id);
    if (!cartSessionRes.ok) {
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const cartSession: string | undefined = cartSessionRes.val;
    if (typeof cartSession === 'undefined') {
      throw new HttpException(
        'User has no active cart',
        HttpStatus.BAD_REQUEST,
      );
    }

    const success = await this.userService.cartCheckout(user.id, cartSession);
    if (!success) {
      throw new HttpException(
        'Empty cart cannot be checked out',
        HttpStatus.BAD_REQUEST,
      );
    }
    // return 204 (applied, returning nothing)
    throw new HttpException('', HttpStatus.NO_CONTENT);
  }

  async getCartSession(
    cookieSession: any,
    user: UserEntity | undefined,
  ): Promise<string> {
    if (typeof user === 'undefined') {
      return cookieSession.uuid;
    }
    return await this.userService.ensureUserCartSession(
      user.id,
      cookieSession.uuid,
    );
  }
}
