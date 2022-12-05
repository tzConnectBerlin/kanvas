import request from 'supertest';

import { TEZPAY_PAYPOINT_ADDRESS } from '../src/constants';
import { PaymentService } from '../src/payment/service/payment.service';
import Tezpay from 'tezpay-server';

import * as testUtils from './utils';

export async function runPaymentTests(appReference: () => any) {
  let app: any;
  let paymentService: PaymentService;
  let nftIds: number[];

  const defineCountryIp = async (
    ipAddr: string,
    countryShort: string,
    countryLong: string,
  ) => {
    const ip = paymentService.ipAddrToNum(ipAddr);

    return await testUtils.withDbConn(async (db) => {
      const countryId = (
        await db.query(
          `
INSERT INTO country (country_short, country_long)
VALUES ($1, $2)
RETURNING id
        `,
          [countryShort, countryLong],
        )
      ).rows[0]['id'];
      await db.query(
        `
INSERT INTO ip_country (ip_from, ip_to, country_id)
VALUES ($1, $1, $2)
        `,
        [ip, countryId],
      );

      return countryId;
    });
  };

  const defineCountryVatPercentage = async (
    countryId: number,
    vatPercentage: number,
  ) => {
    await testUtils.withDbConn(async (db) => {
      const vatId = (
        await db.query(
          `
INSERT INTO vat (percentage)
VALUES ($1)
RETURNING id
        `,
          [vatPercentage],
        )
      ).rows[0]['id'];
      await db.query(
        `
UPDATE country
SET vat_id = $1
WHERE id = $2
        `,
        [vatId, countryId],
      );
    });
  };

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

    it('basic tez payment test case', async () => {
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
        vatRate: 0.2,
      });
      expect(paymentIntent.paymentDetails).toStrictEqual(
        paymentIntent.providerPaymentDetails,
      );
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
      await testUtils.withDbConn(async (db) => {
        expect(
          (await db.query('SELECT external_payment_id FROM payment')).rows[0][
            'external_payment_id'
          ],
        ).toEqual(null);
      });
      await testUtils.withDbConn(async (db) => {
        expect(
          (await db.query('SELECT purchaser_country FROM payment')).rows[0][
            'purchaser_country'
          ],
        ).toStrictEqual(null); // if ip cannot be placed this field should be null
      });
    });

    it('basic order-now payment test case (stripe mocked)', async () => {
      const w = await testUtils.newWallet(app);
      paymentService.stripe = {
        paymentIntents: {
          create: () => {
            return {
              id: 'identifier',
              client_secret: 'secret identifier',
            };
          },
        },
      };
      const resp = await request(app.getHttpServer())
        .post('/payment/order-now/10')
        .set('authorization', w.login.bearer)
        .send({
          paymentProviders: ['tezpay', 'stripe'],
        });
      expect(resp.statusCode).toEqual(201);
      const { tezpay, stripe } = resp.body;
      expect(tezpay).toMatchObject({
        provider: 'tezpay',
        providerPaymentDetails: {
          receiverAddress: TEZPAY_PAYPOINT_ADDRESS,
        },
        nfts: [
          {
            id: nftIds[0],
          },
        ],
        vatRate: 0.2,
      });
      expect(tezpay.paymentDetails).toStrictEqual(
        tezpay.providerPaymentDetails,
      );
      expect(Number(tezpay.amountExclVat)).toBeLessThan(Number(tezpay.amount));
      const xtzDecimals = 6;
      expect(
        (
          tezpay.providerPaymentDetails.mutezAmount * Math.pow(10, -xtzDecimals)
        ).toFixed(xtzDecimals),
      ).toEqual(tezpay.amount);
      await testUtils.withDbConn(async (db) => {
        expect(
          (await db.query('SELECT external_payment_id FROM payment')).rows[0][
            'external_payment_id'
          ],
        ).toEqual(null);
      });
      await testUtils.withDbConn(async (db) => {
        expect(
          (await db.query('SELECT purchaser_country FROM payment')).rows[0][
            'purchaser_country'
          ],
        ).toStrictEqual(null); // if ip cannot be placed this field should be null
      });

      expect(stripe).toMatchObject({
        provider: 'stripe',
        providerPaymentDetails: {
          id: 'identifier',
          clientSecret: 'secret identifier',
        },
        nfts: [
          {
            id: nftIds[0],
          },
        ],
        vatRate: 0.2,
      });
      expect(stripe.paymentDetails).toStrictEqual(
        stripe.providerPaymentDetails,
      );
      expect(Number(stripe.amountExclVat)).toBeLessThan(Number(stripe.amount));
      const eurDecimals = 2;
      expect(
        (
          stripe.providerPaymentDetails.amount * Math.pow(10, -eurDecimals)
        ).toFixed(eurDecimals),
      ).toEqual(stripe.amount);
      await testUtils.withDbConn(async (db) => {
        expect(
          (await db.query('SELECT external_payment_id FROM payment')).rows[0][
            'external_payment_id'
          ],
        ).toEqual('identifier');
      });
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

    it('basic stripe payment test case (mocked)', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      paymentService.stripe = {
        paymentIntents: {
          create: () => {
            return {
              id: 'identifier',
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
      expect(resp.statusCode).toEqual(201);
      const paymentIntent = resp.body;
      expect(paymentIntent).toMatchObject({
        provider: 'stripe',
        providerPaymentDetails: {
          id: 'identifier',
          clientSecret: 'secret identifier',
        },
        nfts: [
          {
            id: nftIds[0],
          },
        ],
        vatRate: 0.2,
      });
      expect(paymentIntent.paymentDetails).toStrictEqual(
        paymentIntent.providerPaymentDetails,
      );
      expect(Number(paymentIntent.amountExclVat)).toBeLessThan(
        Number(paymentIntent.amount),
      );
      const eurDecimals = 2;
      expect(
        (
          paymentIntent.providerPaymentDetails.amount *
          Math.pow(10, -eurDecimals)
        ).toFixed(eurDecimals),
      ).toEqual(paymentIntent.amount);
      await testUtils.withDbConn(async (db) => {
        expect(
          (await db.query('SELECT external_payment_id FROM payment')).rows[0][
            'external_payment_id'
          ],
        ).toEqual('identifier');
      });
    });

    it('stripe payment with XTZ currency => 400', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      paymentService.stripe = {
        paymentIntents: {
          create: () => {
            return {
              id: 'identifier',
              client_secret: 'secret identifier',
            };
          },
        },
      };
      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency: 'XTZ',
          paymentProvider: 'stripe',
        });
      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toStrictEqual({
        statusCode: 400,
        message: 'currency (XTZ) is not supported for stripe',
      });
    });

    it('stripe payment fails with 500 if stripe fails to give us a client_secret value', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      paymentService.stripe = {
        paymentIntents: {
          create: () => {
            return {
              id: 'identifier',
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
      expect(resp.body).toStrictEqual({
        statusCode: 500,
        message: 'failed to create payment intent with stripe',
      });
    });

    it(`a call to /stripe-webhook fails with 501 if stripe isn't enabled`, async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);
      const resp = await request(app.getHttpServer()).post(
        '/payment/stripe-webhook',
      );

      expect(resp.statusCode).toEqual(501);
      expect(resp.body).toStrictEqual({
        statusCode: 501,
        message: 'stripe is not enabled in this kanvas instance',
      });
    });

    it(`create payment intent for non existing provider => 400`, async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);
      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency: 'EUR',
          paymentProvider: 'payment provider that doesnt exist',
        });

      expect(resp.statusCode).toEqual(400);
      expect(resp.body).toStrictEqual({
        statusCode: 400,
        message: `requested payment provider not available`,
      });
    });

    it('vat behavior for an extremely cheap NFT', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      paymentService.stripe = {
        paymentIntents: {
          create: () => {
            return {
              id: 'identifier',
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
      expect(resp.statusCode).toEqual(201);
      const paymentIntent = resp.body;
      expect(paymentIntent).toMatchObject({
        provider: 'stripe',
        providerPaymentDetails: {
          id: 'identifier',
          clientSecret: 'secret identifier',
        },
        nfts: [
          {
            id: nftIds[0],
            price: '0.10',
          },
        ],
        vatRate: 0.2,
        amountExclVat: '0.08',
      });
      expect(paymentIntent.paymentDetails).toStrictEqual(
        paymentIntent.providerPaymentDetails,
      );
    });

    it('basic wert payment test case (mocked)', async () => {
      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      paymentService.signWertData = (args: any) => {
        const { commodity_amount, ...verifyArgFields } = args;
        return verifyArgFields;
      };
      const currency = 'USD';
      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency,
          paymentProvider: 'wert',
        });
      expect(resp.statusCode).toEqual(201);

      const tezpayExternalId = await testUtils.withDbConn(async (db) => {
        return (await db.query('SELECT external_id FROM tezpay.payments'))
          .rows[0]['external_id'];
      });

      const paymentIntent = resp.body;
      expect(paymentIntent).toMatchObject({
        provider: 'wert',
        providerPaymentDetails: {
          wertData: {
            currency,
            commodity: 'XTZ',
            pk_id: 'key1',
            sc_address: TEZPAY_PAYPOINT_ADDRESS,
            address: w.pkh,
            sc_id: Buffer.from(tezpayExternalId).toString('hex'),
            sc_input_data: Buffer.from(
              `{
  "entrypoint": "pay",
  "value": {"string":"${tezpayExternalId}"}
}`,
            ).toString('hex'),
          },
        },
        nfts: [
          {
            id: nftIds[0],
          },
        ],
        vatRate: 0.2,
      });
      expect(paymentIntent.paymentDetails).toStrictEqual(
        paymentIntent.providerPaymentDetails,
      );
      expect(Number(paymentIntent.amountExclVat)).toBeLessThan(
        Number(paymentIntent.amount),
      );
      await testUtils.withDbConn(async (db) => {
        expect(
          (await db.query('SELECT external_payment_id FROM payment')).rows[0][
            'external_payment_id'
          ],
        ).toEqual(null);
      });
    });

    for (const currency of ['EUR', 'GBP', 'XTZ']) {
      it(`${currency} not allowed for wert payments`, async () => {
        const w = await testUtils.newWallet(app);

        await testUtils.cartAdd(app, nftIds[0], w);

        paymentService.signWertData = () => {
          return {
            wert_field1: 'some field',
            wert_field2: true,
            wert_field3: 104.3,
          };
        };
        const resp = await request(app.getHttpServer())
          .post('/payment/create-payment-intent')
          .set('authorization', w.login.bearer)
          .send({
            currency,
            paymentProvider: 'wert',
          });
        expect(resp.statusCode).toEqual(400);
        expect(resp.body).toStrictEqual({
          statusCode: 400,
          message: `requested fiat (${currency}) is not supported by Wert`,
        });
      });
    }

    for (const provider of ['wert', 'simplex', 'stripe']) {
      it(`create payment intent with optionally enabled provider ${provider} not enabled => 501`, async () => {
        const w = await testUtils.newWallet(app);

        await testUtils.cartAdd(app, nftIds[0], w);
        const resp = await request(app.getHttpServer())
          .post('/payment/create-payment-intent')
          .set('authorization', w.login.bearer)
          .send({
            currency: 'EUR',
            paymentProvider: provider,
          });

        expect(resp.statusCode).toEqual(501);
        expect(resp.body).toStrictEqual({
          statusCode: 501,
          message: `${provider} payment provider not supported by this API instance`,
        });
      });
    }

    it(`trigger weird internal error on create payment intent => 500`, async () => {
      const w = await testUtils.newWallet(app);

      paymentService.tezpay = new Tezpay({
        paypoint_schema_name: 'paypoint',
        db_pool: undefined,
        block_confirmations: 2,
      });

      await testUtils.cartAdd(app, nftIds[0], w);
      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .send({
          currency: 'XTZ',
          paymentProvider: 'tezpay',
        });

      expect(resp.statusCode).toEqual(500);
      expect(resp.body).toStrictEqual({
        statusCode: 500,
        message: 'unable to place the order',
      });
    });

    it(`user cannot promisePaid of another user's payment => 500 without too insightful message`, async () => {
      const w1 = await testUtils.newWallet(app);
      const w2 = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w1);
      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w1.login.bearer)
        .send({
          currency: 'XTZ',
          paymentProvider: 'tezpay',
        });
      expect(resp.statusCode).toEqual(201);

      const respW2 = await request(app.getHttpServer())
        .post('/payment/promise-paid')
        .set('authorization', w2.login.bearer)
        .send({
          payment_id: resp.body.id,
        });
      expect(respW2.statusCode).toEqual(400);
      expect(respW2.body).toStrictEqual({
        statusCode: 400,
        message: 'nft order not found',
      });

      const respW1 = await request(app.getHttpServer())
        .post('/payment/promise-paid')
        .set('authorization', w1.login.bearer)
        .send({
          payment_id: resp.body.id,
        });
      expect(respW1.statusCode).toEqual(201);
    });

    it(`user cannot see order information of another user's payment => 400 without too insightful message`, async () => {
      const w1 = await testUtils.newWallet(app);
      const w2 = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w1);
      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w1.login.bearer)
        .send({
          currency: 'XTZ',
          paymentProvider: 'tezpay',
        });
      expect(resp.statusCode).toEqual(201);

      const respW2 = await request(app.getHttpServer())
        .get(`/payment/order-info/${resp.body.id}`)
        .set('authorization', w2.login.bearer);
      expect(respW2.statusCode).toEqual(400);
      expect(respW2.body).toStrictEqual({
        statusCode: 400,
        message: 'nft order not found',
      });

      const respW1 = await request(app.getHttpServer())
        .get(`/payment/order-info/${resp.body.id}`)
        .set('authorization', w1.login.bearer);
      expect(respW1.statusCode).toEqual(200);
    });

    it(`get order info on weird internal err (lost payment) => 500`, async () => {
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

      await testUtils.withDbConn(async (db) => {
        await db.query('DELETE FROM payment');
      });

      const respOrderInfo = await request(app.getHttpServer())
        .get(`/payment/order-info/${resp.body.id}`)
        .set('authorization', w.login.bearer);
      expect(respOrderInfo.statusCode).toEqual(500);
      expect(respOrderInfo.body).toStrictEqual({
        statusCode: 500,
        message: 'failed to get order info',
      });
    });

    it('vat for a country that has no vat defined => defaults to the fallback vat country', async () => {
      const ipAddr = '240.200.10.5';
      await defineCountryIp(ipAddr, 'XX', 'test country');

      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .set('X-Forwarded-For', ipAddr)
        .send({
          currency: 'XTZ',
          paymentProvider: 'tezpay',
        });
      expect(resp.statusCode).toEqual(201);
      const paymentIntent = resp.body;
      expect(paymentIntent).toMatchObject({
        vatRate: 0.2,
      });
      await testUtils.withDbConn(async (db) => {
        expect(
          (await db.query('SELECT purchaser_country FROM payment')).rows[0][
            'purchaser_country'
          ],
        ).toStrictEqual('XX');
      });
    });

    it('vat for a country that has vat defined => vat from that country is applied', async () => {
      const vatRate = 0.15;
      const ipAddr = '240.200.10.5';
      const countryId = await defineCountryIp(ipAddr, 'AX', 'test country');
      await defineCountryVatPercentage(countryId, vatRate * 100);

      const w = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, nftIds[0], w);

      const resp = await request(app.getHttpServer())
        .post('/payment/create-payment-intent')
        .set('authorization', w.login.bearer)
        .set('X-Forwarded-For', ipAddr)
        .send({
          currency: 'XTZ',
          paymentProvider: 'tezpay',
        });
      expect(resp.statusCode).toEqual(201);
      const paymentIntent = resp.body;
      expect(paymentIntent).toMatchObject({
        vatRate,
      });
      await testUtils.withDbConn(async (db) => {
        expect(
          (await db.query('SELECT purchaser_country FROM payment')).rows[0][
            'purchaser_country'
          ],
        ).toStrictEqual('AX');
      });
    });
  });
}
