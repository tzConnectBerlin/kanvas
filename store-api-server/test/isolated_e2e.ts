import request from 'supertest';

import { PaymentService } from '../src/payment/service/payment.service';
import {
  PaymentStatus,
  OrderStatus,
} from '../src/payment/entity/payment.entity.js';

import * as testUtils from './utils';

export async function runIsolatedTests(appReference: () => any) {
  let app: any;
  let paymentService: PaymentService;
  let nftIds: number[];

  const newNftId = () => {
    const id = nftIds[nftIds.length - 1] + 1;
    nftIds.push(id);
    return id;
  };

  describe('clean e2e test cases (db is reset between each test)', () => {
    beforeEach(async () => {
      [app, paymentService] = appReference();
      nftIds = await testUtils.resetDb();
    });
    afterAll(async () => {
      await testUtils.resetDb(true);
    });

    it('NFTs that are not for sale yet cannot be added to the cart', async () => {
      const wallet1 = await testUtils.newWallet(app);
      await testUtils.withDbConn(async (db) => {
        await db.query(`
UPDATE nft
SET onsale_from = now() AT TIME ZONE 'UTC' + interval '1 hour'
WHERE id = ${nftIds[0]}
            `);
      });
      const resp = await request(app.getHttpServer())
        .post(`/users/cart/add/${nftIds[0]}`)
        .set('authorization', wallet1.login.bearer);
      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toStrictEqual({
        statusCode: 400,
        message: 'This nft is not yet for sale',
      });

      const cart = await testUtils.cartList(app, wallet1);
      expect(cart).toStrictEqual({
        nfts: [],
      });
    });

    it('NFTs that are no longer for sale cannot be added to the cart', async () => {
      const wallet1 = await testUtils.newWallet(app);
      await testUtils.withDbConn(async (db) => {
        await db.query(`
UPDATE nft
SET onsale_until = now() AT TIME ZONE 'UTC' - interval '1 hour'
WHERE id = ${nftIds[0]}
            `);
      });
      const resp = await request(app.getHttpServer())
        .post(`/users/cart/add/${nftIds[0]}`)
        .set('authorization', wallet1.login.bearer);
      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toStrictEqual({
        statusCode: 400,
        message: 'This nft is no longer for sale',
      });

      const cart = await testUtils.cartList(app, wallet1);
      expect(cart).toStrictEqual({
        nfts: [],
      });
    });

    for (const tc of [
      {
        input: {
          afterPaymentStatus: PaymentStatus.SUCCEEDED,
        },
        exp: {
          statusCode: 201,
          paymentStatus: PaymentStatus.SUCCEEDED,
          orderStatus: OrderStatus.DELIVERING,
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.PROCESSING,
        },
        exp: {
          statusCode: 201,
          paymentStatus: PaymentStatus.PROCESSING,
          orderStatus: OrderStatus.PENDING_PAYMENT,
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.PROMISED,
        },
        exp: {
          statusCode: 201,
          paymentStatus: PaymentStatus.PROMISED,
          orderStatus: OrderStatus.PENDING_PAYMENT,
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.FAILED,
        },
        exp: {
          statusCode: 201,
          paymentStatus: PaymentStatus.PROMISED,
          orderStatus: OrderStatus.PENDING_PAYMENT,
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.CANCELED,
        },
        exp: {
          statusCode: 400,
          paymentStatus: PaymentStatus.CANCELED,
          orderStatus: OrderStatus.CANCELED,
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.TIMED_OUT,
        },
        exp: {
          statusCode: 400,
          paymentStatus: PaymentStatus.TIMED_OUT,
          orderStatus: OrderStatus.CANCELED,
        },
      },
    ]) {
      it(`An order that is promise-paid _after_ status changed to ${tc.input.afterPaymentStatus} => promise-paid returns ${tc.exp.statusCode} and payment status is ${tc.exp.paymentStatus}`, async () => {
        const wallet1 = await testUtils.newWallet(app);

        const cartAdd = await request(app.getHttpServer())
          .post(`/users/cart/add/${nftIds[0]}`)
          .set('authorization', wallet1.login.bearer);
        expect(cartAdd.statusCode).toEqual(201);

        const checkoutData = await testUtils.checkout(
          paymentService,
          wallet1,
          tc.input.afterPaymentStatus,
          false,
        );

        const promisePaidResp = await request(app.getHttpServer())
          .post(`/payment/promise-paid`)
          .send({ payment_id: checkoutData.paymentId })
          .set('authorization', wallet1.login.bearer);
        expect(promisePaidResp.statusCode).toEqual(tc.exp.statusCode);

        await testUtils.withDbConn(async (db) => {
          const statusQryRes = await db.query(
            'SELECT status FROM payment WHERE payment_id = $1',
            [checkoutData.paymentId],
          );

          expect(statusQryRes.rows[0]['status']).toStrictEqual(
            tc.exp.paymentStatus,
          );
        });

        const orderInfo: any = await testUtils.getOrderInfo(
          app,
          wallet1,
          checkoutData.paymentId,
        );
        const expPaymentIntents: any = {};
        expPaymentIntents[checkoutData.paymentId] = {
          status: tc.exp.paymentStatus,
        };
        orderInfo.paymentIntents = orderInfo.paymentIntents.reduce(
          (res: any, intent: any) => {
            res[intent.paymentId] = intent;
            return res;
          },
          {},
        );
        expect(orderInfo).toMatchObject({
          orderedNfts: [
            {
              id: nftIds[0],
            },
          ],
          orderStatus: tc.exp.orderStatus,
          paymentIntents: expPaymentIntents,
        });
        if (
          ![OrderStatus.DELIVERING, OrderStatus.DELIVERED].includes(
            tc.exp.orderStatus,
          )
        ) {
          expect(typeof orderInfo.delivery).toEqual('undefined');
        }
      });
    }
  });
}
