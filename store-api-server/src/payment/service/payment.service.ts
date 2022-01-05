import { Injectable, Inject, HttpStatus, Logger } from '@nestjs/common';
import { PG_CONNECTION } from 'src/constants';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/service/user.service';
import { Err } from 'ts-results';

export enum PaymentStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  CANCELED = 'canceled',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed'
}

interface NftOrder {
  id: number;
  userId: number;
  orderAt: number;
}

export interface StripePaymentIntent {
  clientSecret: string;
}

const stripe = require("stripe")(process.env.STRIPE_SECRET);

@Injectable()
export class PaymentService {

  constructor(
    @Inject(PG_CONNECTION) private conn: any,
    private userService: UserService,
  ) { }

  async createStripePayment(cookieSession: any, user: UserEntity): Promise<StripePaymentIntent> {

    const cartSession = await this.userService.getCartSession(cookieSession, user);

    const cartList = await this.userService.cartList(cartSession)

    const amount = cartList.nfts.reduce((sum, nft) => sum + nft.price, 0)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "eur", // Have to change this to handle different currencies
      automatic_payment_methods: {
        enabled: false,
      },
    });

    
    // Fetch
    // if order and payment not yet set:
    // else create

    const nftOrder = await this.createNftOrder(cartSession, user.id)

    await this.createPayment(paymentIntent.id, nftOrder.id, 'stripe')

    return { clientSecret: paymentIntent.client_secret }
  }

  async createPayment(paymentId: string, nftOrderId: number, provider: string): Promise<boolean> {

    const tx = await this.conn.connect();
    try {
      tx.query('BEGIN');

      await tx.query(
        `
  INSERT INTO payment (
    payment_id, status, nft_order_id, provider
  )
  VALUES ($1, $2, $3, $4)
  RETURNING id`,
        [paymentId, PaymentStatus.CREATED, nftOrderId, provider],
      );

      await tx.query('COMMIT');
    } catch (err) {
      await tx.query('ROLLBACK');
      throw err;
    } finally {
      tx.release();
    }

    return true
  }

  async editPaymentStatus(status: PaymentStatus, paymentId: string) {
    const tx = await this.conn.connect();
    try {
      tx.query('BEGIN');

      // Add check to verify if status is created or processing

      await tx.query(
        `
  UPDATE payment
  SET status = $1
  WHERE payment_id = $2`,
        [status, paymentId],
      );

      await tx.query('COMMIT');
    } catch (err) {
      await tx.query('ROLLBACK');
      throw err;
    } finally {
      tx.release();
    }
  }

  async createNftOrder(session: string, userId: number): Promise<NftOrder> {
    const cartMeta = await this.userService.getCartMeta(session);

    if (typeof cartMeta === 'undefined') {
      throw Err(
        `createNftOrder err: cart should not be empty`,
      );
    }

    const tx = await this.conn.connect();

    let nftOrderId: number;
    let orderAt = new Date();

    try {
      tx.query('BEGIN');
      const nftQryRes = await tx.query(
        `
  INSERT INTO nft_order (
    user_id, order_at
  )
  VALUES ($1, $2)
  RETURNING id`,
        [userId, orderAt.toUTCString()],
      );

      nftOrderId = nftQryRes.rows[0]['id'];

      await tx.query(
        `
INSERT INTO mtm_nft_order_nft (
  nft_order_id, nft_id
)
SELECT $1, nft_id FROM mtm_cart_session_nft
WHERE cart_session_id = $2
        `,
        [nftOrderId, cartMeta.id],
      );

      await tx.query(
        `
  UPDATE cart_session
  SET order_id = $1
  WHERE id = $2
        `
      , [nftOrderId, cartMeta.id])

      await tx.query('COMMIT');
    } catch (err) {
      console.log(err)
      await tx.query('ROLLBACK');
      throw err;
    } finally {
      tx.release();
    }

    return <NftOrder>{
      id: nftOrderId,
      orderAt: Math.floor(orderAt.getTime() / 1000),
      userId: userId,
    }
  }
}
