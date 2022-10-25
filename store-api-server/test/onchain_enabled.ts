import request from 'supertest';

import { PaymentService } from '../src/payment/service/payment.service';
import { assertEnv } from '../src/utils';

import * as testUtils from './utils';

export async function runOnchainEnabledTests(appReference: () => any) {
  let app: any;
  let paymentService: PaymentService;
  let nftIds: number[];

  const newNftId = () => {
    const id = nftIds[nftIds.length - 1] + 1;
    nftIds.push(id);
    return id;
  };

  const onchainTestTimeoutMs = 15000;

  describe('clean e2e test cases (db is reset between each test)', () => {
    beforeEach(async () => {
      [app, paymentService] = appReference();
      nftIds = await testUtils.resetDb();
    });
    afterAll(async () => {
      await testUtils.resetDb(true);
    });

    it(
      'paid nft becomes owned after 2 blocks',
      async () => {
        const wallet1 = await testUtils.newWallet(app);
        await testUtils.cartAdd(app, nftIds[0], wallet1);
        await testUtils.checkout(paymentService, wallet1);

        await testUtils.waitBlocks();

        const profile = await testUtils.getProfile(app, wallet1);
        expect(profile).toMatchObject({
          pendingOwnership: [],
          collection: {
            nfts: [
              {
                id: nftIds[0],
                ownershipInfo: [{ status: 'owned' }],
              },
            ],
          },
        });
      },
      onchainTestTimeoutMs,
    );

    it(
      'user can buy same nft twice, both become owned',
      async () => {
        const wallet1 = await testUtils.newWallet(app);
        await testUtils.cartAdd(app, nftIds[0], wallet1);
        await testUtils.checkout(paymentService, wallet1);
        await testUtils.cartAdd(app, nftIds[0], wallet1);
        await testUtils.checkout(paymentService, wallet1);

        await testUtils.waitBlocks(2);

        const profile = await testUtils.getProfile(app, wallet1);
        expect(profile).toMatchObject({
          pendingOwnership: [],
          collection: {
            nfts: [
              {
                id: nftIds[0],
                ownershipInfo: [{ status: 'owned' }, { status: 'owned' }],
              },
            ],
          },
        });
      },
      onchainTestTimeoutMs,
    );

    it(
      'user can transfer nft onchain, it will then be present in target user profile',
      async () => {
        const wallet1 = await testUtils.newWallet(app, 1);
        const wallet2 = await testUtils.newWallet(app);

        await testUtils.cartAdd(app, nftIds[0], wallet1);
        await testUtils.checkout(paymentService, wallet1);
        await testUtils.waitBlocks(2);

        await testUtils.transferNft(wallet1, wallet2.pkh, nftIds[0]);
        await testUtils.waitBlocks(2);

        const profileWallet1 = await testUtils.getProfile(app, wallet1);
        expect(profileWallet1).toMatchObject({
          pendingOwnership: [],
          collection: {
            nfts: [],
          },
        });

        const profileWallet2 = await testUtils.getProfile(app, wallet2);
        expect(profileWallet2).toMatchObject({
          pendingOwnership: [],
          collection: {
            nfts: [
              {
                id: nftIds[0],
                ownershipInfo: [{ status: 'owned' }],
              },
            ],
          },
        });
      },
      onchainTestTimeoutMs,
    );

    it(
      'user can transfer nft onchain, but it will not be present in target user profile if the target user has no kanvas account (note: this is actually undesirable, but for the moment it is the behavior of the API)',
      async () => {
        const wallet1 = await testUtils.newWallet(app, 1);
        const wallet2Pkh = assertEnv('BOB_PKH');

        await testUtils.cartAdd(app, nftIds[0], wallet1);
        await testUtils.checkout(paymentService, wallet1);
        await testUtils.waitBlocks(2);

        await testUtils.transferNft(wallet1, wallet2Pkh, nftIds[0]);
        await testUtils.waitBlocks(2);

        const profileWallet1 = await testUtils.getProfile(app, wallet1);
        expect(profileWallet1).toMatchObject({
          pendingOwnership: [],
          collection: {
            nfts: [],
          },
        });

        const profileWallet2 = await request(app.getHttpServer())
          .get('/users/profile')
          .query({ userAddress: wallet2Pkh });
        expect(profileWallet2.statusCode).toEqual(400);

        // once wallet2 is registered, the nft is shown in the profile
        const registrationResp = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            userAddress: wallet2Pkh,
            signedPayload: 'pass',
          });
        expect(registrationResp.statusCode).toEqual(201);

        const profileWallet2PostRegistration = await request(
          app.getHttpServer(),
        )
          .get('/users/profile')
          .query({ userAddress: wallet2Pkh });
        expect(profileWallet2PostRegistration.body).toMatchObject({
          pendingOwnership: [],
          collection: {
            nfts: [
              {
                id: nftIds[0],
                ownershipInfo: [{ status: 'owned' }],
              },
            ],
          },
        });
      },
      onchainTestTimeoutMs,
    );

    it('paid proxy nft results in delivery of next proxy unfold nft', async () => {
      const setup = await testUtils.basicProxySetup(app, newNftId);

      const wallet1 = await testUtils.newWallet(app);
      await testUtils.cartAdd(app, setup.proxyNftId, wallet1);
      await testUtils.checkout(paymentService, wallet1);

      await testUtils.waitBlocks();

      const profile = await testUtils.getProfile(app, wallet1);
      expect(profile).toMatchObject({
        pendingOwnership: [],
        collection: {
          nfts: [
            {
              id: setup.proxiedNftIds[0],
              ownershipInfo: [{ status: 'owned' }],
            },
          ],
        },
      });
    });

    it(
      'some tests with paying all editions of a proxy nft',
      async () => {
        const setup = await testUtils.basicProxySetup(app, newNftId);

        const wallet1 = await testUtils.newWallet(app);

        const expOwnedNfts: any[] = [];

        const nextProxyPurchase = async (expProxiedNftId: number) => {
          await testUtils.cartAdd(app, setup.proxyNftId, wallet1);
          await testUtils.checkout(paymentService, wallet1);

          await testUtils.waitBlocks();

          expOwnedNfts.push({
            id: expProxiedNftId,
            ownershipInfo: [{ status: 'owned' }],

            editionsSize: 1,
            editionsSold: 1,
            editionsAvailable: 0,
          });

          const profile = await testUtils.getProfile(app, wallet1);
          expect(profile).toMatchObject({
            pendingOwnership: [],
            collection: {
              nfts: expOwnedNfts,
            },
          });
        };

        for (const proxiedNftId of setup.proxiedNftIds) {
          await nextProxyPurchase(proxiedNftId);
        }

        // all editions should be claimed now, adding to cart should result in 400
        await testUtils.cartAdd(app, setup.proxyNftId, wallet1, 400);

        // verify all editions available and sold are correct
        const resp = await request(app.getHttpServer())
          .get(`/nfts`)
          .query({
            categories: `${setup.proxyCategoryId},${setup.proxiedCategoryId}`,
          });
        expect(resp.body).toMatchObject({
          totalNftCount: 3,
          nfts: [
            {
              id: setup.proxyNftId,

              editionsSize: 2,
              editionsAvailable: 0,
              editionsSold: 2,
            },
            {
              id: setup.proxiedNftIds[0],

              editionsSize: 1,
              editionsAvailable: 0,
              editionsSold: 1,
            },
            {
              id: setup.proxiedNftIds[1],

              editionsSize: 1,
              editionsAvailable: 0,
              editionsSold: 1,
            },
          ],
        });
      },
      onchainTestTimeoutMs,
    );
  });
}
