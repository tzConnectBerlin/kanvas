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

    it('NFT formats are returned in GET /nfts/:id', async () => {
      await testUtils.withDbConn(async (db) => {
        const addFormat = async (
          contentName: string,
          attr: string,
          val: any,
        ) => {
          const formatId = (
            await db.query(
              `
INSERT INTO format (content_name, attribute, value)
VALUES ($1, $2, $3::jsonb)
RETURNING id`,
              [contentName, attr, val],
            )
          ).rows[0]['id'];

          await db.query(
            `
INSERT INTO mtm_nft_format (nft_id, format_id)
VALUES ($1, $2)
        `,
            [nftIds[0], formatId],
          );
        };
        await addFormat('artifact', 'mimeType', '"image/png"');
        await addFormat('artifact', 'width', '400');
        await addFormat('artifact', 'height', '500');

        await addFormat('display', 'height', '450');
      });

      const resp = await request(app.getHttpServer()).get(`/nfts/${nftIds[0]}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toMatchObject({
        id: nftIds[0],

        formats: {
          artifact: {
            mimeType: 'image/png',
            width: 400,
            height: 500,
          },
          display: {
            height: 450,
          },
        },

        metadata: {
          test: {
            nested: 10,
          },
        },
      });
    });

    it('NFT create with formats field specified', async () => {
      const nftId = nftIds[nftIds.length - 1] + 1;
      await testUtils.createNft(app, {
        id: nftId,

        name: 'test',
        description: 'test description',

        artifactUri: 'some_s3_uri',

        price: 0.5,
        categories: [10],
        editionsSize: 4,

        formats: {
          artifact: {
            mimeType: 'video/mp4',
            width: 300,
            height: 550,
            duration: '00:10:15',
          },
          thumbnail: {
            height: 450,
          },
        },
      });

      const resp = await request(app.getHttpServer()).get(`/nfts/${nftId}`);
      expect(resp.statusCode).toEqual(200);
      expect(resp.body).toMatchObject({
        id: nftId,

        formats: {
          artifact: {
            mimeType: 'video/mp4',
            width: 300,
            height: 550,
            duration: '00:10:15',
          },
          thumbnail: {
            height: 450,
          },
        },
      });
    });

    it('same formats fields specified results in normalized db representation', async () => {
      const nftId = nftIds[nftIds.length - 1] + 1;
      await testUtils.createNft(app, {
        id: nftId,

        name: 'test',
        description: 'test description',

        artifactUri: 'some_s3_uri',

        price: 0.5,
        categories: [10],
        editionsSize: 4,

        formats: {
          artifact: {
            mimeType: 'video/mp4',
            width: 300,
          },
          thumbnail: {
            height: 450,
          },
        },
      });
      await testUtils.createNft(app, {
        id: nftId + 1,

        name: 'test',
        description: 'test description',

        artifactUri: 'some_s3_uri',

        price: 0.5,
        categories: [10],
        editionsSize: 4,

        formats: {
          artifact: {
            mimeType: 'video/mp4', // same as above, not an additional format table row
            width: 350, // differs, expecting a new format table row
          },
          thumbnail: {
            height: 450, // same as above, not an additional format table row
          },
        },
      });

      await testUtils.withDbConn(async (db) => {
        const res = (
          await db.query(`
SELECT
  (SELECT count(1) FROM format) AS format_count,
  (SELECT count(1) FROM mtm_nft_format) AS mtm_count`)
        ).rows.map((row: any) => {
          return {
            formatCount: Number(row['format_count']),
            mtmCount: Number(row['mtm_count']),
          };
        });
        expect(res).toStrictEqual([
          {
            formatCount: 4,
            mtmCount: 6,
          },
        ]);
      });
    });
  });
}
