import request from 'supertest';
import axios from 'axios';

import {
  PaymentService,
  PaymentStatus,
} from '../src/payment/service/payment.service';
import { PaymentProvider } from '../src/payment/entity/payment.entity.js';
import { UserEntity } from '../src/user/entity/user.entity';
import { assertEnv, sleep } from '../src/utils';

import * as testUtils from './utils';

// isolated here means that each test does not affect the later tests' expected
// results
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
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.PROCESSING,
        },
        exp: {
          statusCode: 201,
          paymentStatus: PaymentStatus.PROCESSING,
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.PROMISED,
        },
        exp: {
          statusCode: 201,
          paymentStatus: PaymentStatus.PROMISED,
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.FAILED,
        },
        exp: {
          statusCode: 201,
          paymentStatus: PaymentStatus.PROMISED,
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.CANCELED,
        },
        exp: {
          statusCode: 400,
          paymentStatus: PaymentStatus.CANCELED,
        },
      },
      {
        input: {
          afterPaymentStatus: PaymentStatus.TIMED_OUT,
        },
        exp: {
          statusCode: 400,
          paymentStatus: PaymentStatus.TIMED_OUT,
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
      });
    }

    it(`proxy nft test`, async () => {
      let proxyCategoryId;
      let unfoldCategoryId;

      // simpler to run this test with fresh categories
      await testUtils.withDbConn(async (conn) => {
        proxyCategoryId = (
          await conn.query(`
insert into nft_category (
  category, description
)
values
  ('Root', 'root category, assigned to the proxy nft')
RETURNING id
`)
        ).rows[0]['id'];
        unfoldCategoryId = (
          await conn.query(
            `
insert into nft_category (
  category, description, parent
)
values
  ('Root', 'root category, assigned to the proxy nft', $1)
RETURNING id
`,
            [proxyCategoryId],
          )
        ).rows[0]['id'];
      });

      const proxyNftId = newNftId();
      await testUtils.createNft(app, {
        id: proxyNftId,
        name: 'the proxy nft',
        description: 'this nft is a proxy',
        price: 5,
        artifactUri: 'proxy_img',
        editionsSize: 0,
        categories: [proxyCategoryId],
      });
      const proxiedNftId1 = newNftId();
      await testUtils.createProxiedNft(app, {
        id: proxiedNftId1,
        proxyNftId,
        name: 'one of the unfoldings',
        description: 'this nft is proxied',
        artifactUri: 'unfolded_img',
        editionsSize: 0,
        categories: [unfoldCategoryId],
      });
      const proxiedNftId2 = newNftId();
      await testUtils.createProxiedNft(app, {
        id: proxiedNftId2,
        proxyNftId,
        name: 'another of the unfoldings',
        description: 'this nft is proxied',
        artifactUri: 'unfolded_img2',
        editionsSize: 0,
        categories: [unfoldCategoryId],
      });

      // not setting proxiesFolded returns both the proxy as well as the unfolding
      const proxiesUnspecifiedResp = await request(app.getHttpServer())
        .get(`/nfts`)
        .query({ categories: `${proxyCategoryId},${unfoldCategoryId}` });
      expect(proxiesUnspecifiedResp.body).toMatchObject({
        totalNftCount: 3,
        nfts: [
          {
            id: proxyNftId,
            editionsSize: 2, // editionsSize should automatically become number of proxied nfts
          },
          {
            id: proxiedNftId1,
          },
          {
            id: proxiedNftId2,
          },
        ],
      });

      // setting proxiesFolded to true returns only the proxy
      const proxiesFoldedResp = await request(app.getHttpServer())
        .get(`/nfts`)
        .query({
          proxiesFolded: 'true',
          categories: `${proxyCategoryId},${unfoldCategoryId}`,
        });
      expect(proxiesFoldedResp.body).toMatchObject({
        totalNftCount: 1,
        nfts: [
          {
            id: proxyNftId,
          },
        ],
      });

      // setting proxiesFolded to false returns only the unfolding
      const proxiesUnfoldedResp = await request(app.getHttpServer())
        .get(`/nfts`)
        .query({
          proxiesFolded: 'false',
          categories: `${proxyCategoryId},${unfoldCategoryId}`,
        });
      expect(proxiesUnfoldedResp.body).toMatchObject({
        totalNftCount: 2,
        nfts: [
          {
            id: proxiedNftId1,
          },
          {
            id: proxiedNftId2,
          },
        ],
      });
    });
  });
}
