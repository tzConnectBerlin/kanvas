import request from 'supertest';

import * as testUtils from './utils';

export async function runProxyNftTests(appReference: () => any) {
  let app: any;
  let nftIds: number[];

  const newNftId = () => {
    const id = nftIds[nftIds.length - 1] + 1;
    nftIds.push(id);
    return id;
  };

  describe('proxy nft tests (with clean e2e test cases, db is reset between each test)', () => {
    beforeEach(async () => {
      [app] = appReference();
      nftIds = await testUtils.resetDb();
    });
    afterAll(async () => {
      await testUtils.resetDb(true);
    });

    it(`not setting proxiesFolded returns both the proxy as well as the unfolding`, async () => {
      const setup = await testUtils.basicProxySetup(app, newNftId);

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
            editionsSize: 2, // editionsSize should automatically become number of proxied nfts
            isProxy: true,
          },
          {
            id: setup.proxiedNftIds[0],
            editionsSize: 1, // editionsSize should automatically be 1 for proxied nfts
            proxyNftId: setup.proxyNftId,
          },
          {
            id: setup.proxiedNftIds[1],
            editionsSize: 1,
            proxyNftId: setup.proxyNftId,
          },
        ],
      });
      const proxyCreatedAt = resp.body.nfts[0].createdAt;
      expect(resp.body.nfts[1].createdAt).toStrictEqual(proxyCreatedAt);
      expect(resp.body.nfts[2].createdAt).toStrictEqual(proxyCreatedAt);
    });

    it(`setting proxiesFolded to true returns only the proxy`, async () => {
      const setup = await testUtils.basicProxySetup(app, newNftId);

      const resp = await request(app.getHttpServer())
        .get(`/nfts`)
        .query({
          proxyFolding: 'fold',
          categories: `${setup.proxyCategoryId},${setup.proxiedCategoryId}`,
        });
      expect(resp.body).toMatchObject({
        totalNftCount: 1,
        nfts: [
          {
            id: setup.proxyNftId,
          },
        ],
      });
    });

    it(`setting proxiesFolded to false returns only the unfolding`, async () => {
      const setup = await testUtils.basicProxySetup(app, newNftId);

      const resp = await request(app.getHttpServer())
        .get(`/nfts`)
        .query({
          proxyFolding: 'unfold',
          categories: `${setup.proxyCategoryId},${setup.proxiedCategoryId}`,
        });
      expect(resp.body).toMatchObject({
        totalNftCount: 2,
        nfts: [
          {
            id: setup.proxiedNftIds[0],
          },
          {
            id: setup.proxiedNftIds[1],
          },
        ],
      });
    });

    it(`proxied nfts cannot be added to cart`, async () => {
      const setup = await testUtils.basicProxySetup(app, newNftId);
      const wallet = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, setup.proxiedNftIds[0], wallet, 400);
      const cart = await testUtils.cartList(app, wallet);
      expect(cart.nfts).toEqual([]);
    });
    it(`proxy nfts can be added to cart`, async () => {
      const setup = await testUtils.basicProxySetup(app, newNftId);
      const wallet = await testUtils.newWallet(app);

      await testUtils.cartAdd(app, setup.proxyNftId, wallet);
      const cart = await testUtils.cartList(app, wallet);
      expect(cart.nfts).toMatchObject([
        {
          id: setup.proxyNftId,
        },
      ]);
    });
  });
}
