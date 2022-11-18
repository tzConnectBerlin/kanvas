import request from 'supertest';

import { TEZPAY_PAYPOINT_ADDRESS } from '../src/constants';
import { PaymentService } from '../src/payment/service/payment.service';
import {
  PaymentStatus,
  OrderStatus,
} from '../src/payment/entity/payment.entity.js';

import * as testUtils from './utils';

export async function runPaymentTests(appReference: () => any) {
  let app: any;
  let paymentService: PaymentService;
  let nftIds: number[];

  describe('payment e2e tests', () => {
    beforeEach(async () => {
      [app, paymentService] = appReference();
      nftIds = await testUtils.resetDb();
    });
    afterAll(async () => {
      await testUtils.resetDb(true);
    });

    it('create payment without existing cart => 400', async () => {
      const w = await testUtils.newWallet(app);

      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency: 'XTZ',
          paymentProvider: 'tezpay',
        });

      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toEqual({
        statusCode: 400,
        message: 'cannot create order, cart is empty',
      });
    });

    it('create payment with empty cart => 400', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);
      await testUtils.cartRemove(app, nftIds[0], w);

      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency: 'XTZ',
          paymentProvider: 'tezpay',
        });
      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toEqual({
        statusCode: 400,
        message: 'cannot create order, cart is empty',
      });
    });

    it('basic payment test case (tezpay)', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency: 'XTZ',
          paymentProvider: 'tezpay',
        });
      expect(resp.statusCode).toEqual(201);
      const paymentIntent = resp.body;
      expect(paymentIntent).toMatchObject({
        provider: 'tezpay',
        providerPaymentDetails: {
          receiverAddress: TEZPAY_PAYPOINT_ADDRESS,
        },
        nfts: [
          {
            id: nftIds[0],
          },
        ],
        vatRate: 0.05,
      });
      expect(Number(paymentIntent.amountExclVat)).toBeLessThan(
        Number(paymentIntent.amount),
      );
      const xtzDecimals = 6;
      expect(
        (
          paymentIntent.providerPaymentDetails.mutezAmount *
          Math.pow(10, -xtzDecimals)
        ).toFixed(xtzDecimals),
      ).toEqual(paymentIntent.amount);
    });

    for (const currency of ['GBP', 'USD', 'EUR']) {
      it(`non-xtz tezpay (with currency=${currency} => 400`, async () => {
        const w = await testUtils.newWallet(app);

        await testUtils.cartAdd(app, nftIds[0], w);

        const resp = await request(app.getHttpServer())
          .post('/payment/create-payment-intent')
          .set('authorization', w.login.bearer)
          .send({
            currency,
            paymentProvider: 'tezpay',
          });
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toEqual({
          message: `currency (${currency}) is not supported for tezpay`,
          statusCode: 400,
        });
      });
    }

    it('basic payment test case (mocked stripe)', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      paymentService.stripe = {
        paymentIntents: {
          create: () => {
            return {
              client_secret: 'secret identifier',
            };
          },
        },
      };
      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency: 'EUR',
          paymentProvider: 'stripe',
        });
      testUtils.logFullObject(resp.body);
      expect(resp.statusCode).toEqual(201);
      const paymentIntent = resp.body;
      expect(paymentIntent).toMatchObject({
        provider: 'stripe',
        providerPaymentDetails: {
          clientSecret: 'secret identifier',
        },
        nfts: [
          {
            id: nftIds[0],
          },
        ],
        vatRate: 0.05,
      });
      expect(Number(paymentIntent.amountExclVat)).toBeLessThan(
        Number(paymentIntent.amount),
      );
      const eurDecimals = 2;
      expect(
        (
          paymentIntent.providerPaymentDetails.mutezAmount *
          Math.pow(10, -eurDecimals)
        ).toFixed(eurDecimals),
      ).toEqual(paymentIntent.amount);
    });

    it('stripe payment fails with 500 if stripe fails to give us a client_secret value', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      paymentService.stripe = {
        paymentIntents: {
          create: () => {
            return {
              somethingDifferent: '',
            };
          },
        },
      };
      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency: 'EUR',
          paymentProvider: 'stripe',
        });
      expect(resp.statusCode).toEqual(500);
      testUtils.logFullObject(resp.body);
    });

    it('vat behavior for an extremely cheap NFT', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      paymentService.stripe = {
        paymentIntents: {
          create: () => {
            return {
              client_secret: 'secret identifier',
            };
          },
        },
      };
      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency: 'EUR',
          paymentProvider: 'stripe',
        });
      testUtils.logFullObject(resp.body);
      expect(resp.statusCode).toEqual(201);
      const paymentIntent = resp.body;
      expect(paymentIntent).toMatchObject({
        provider: 'stripe',
        providerPaymentDetails: {
          clientSecret: 'secret identifier',
        },
        nfts: [
          {
            id: nftIds[0],
            price: '0.10',
          },
        ],
        vatRate: 0.05,
      });
      expect(Number(paymentIntent.amountExclVat)).toEqual(0.1); // TODO
    });
  });
}
