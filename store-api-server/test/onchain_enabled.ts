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

export async function runOnchainEnabledTests(appReference: () => any) {
  let app: any;
  let paymentService: PaymentService;
  let nftIds: number[];

  describe('clean e2e test cases (db is reset between each test)', () => {
    beforeEach(async () => {
      [app, paymentService] = appReference();
      nftIds = await testUtils.resetDb();
    });
    afterAll(async () => {
      await testUtils.resetDb(true);
    });

    it('paid nft becomes owned after 2 blocks', async () => {
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
    });

    it('user can buy same nft twice, both become owned', async () => {
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
    });

    it('user can transfer nft onchain, it will then be present in target user profile', async () => {
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
    }, 7000);

    it('user can transfer nft onchain, but it will not be present in target user profile if the target user has no kanvas account (note: this is actually undesirable, but for the moment it is the behavior of the API)', async () => {
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

      const profileWallet2PostRegistration = await request(app.getHttpServer())
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
    }, 7000);
  });
}
