import request from 'supertest';

import { TokenGate } from 'token-gate';

import * as testUtils from './utils';

export async function runTokenGateTests(appReference: () => any) {
  const specDir = 'test/token_gates';
  let app: any;
  let gate: TokenGate;
  let nftIds: number[];

  const enableGate = () => gate.loadSpecFromFile(specDir + '/enabled.yaml');
  const disableGate = () => gate.loadSpecFromFile(specDir + '/disabled.yaml');

  describe('clean e2e test cases (db is reset between each test)', () => {
    beforeEach(async () => {
      [app, gate] = appReference();
      nftIds = await testUtils.resetDb();
      disableGate();
    });
    afterAll(async () => {
      await testUtils.resetDb(true);
      disableGate();
    });

    it('/constants should reflect whether there as a token gate', async () => {
      expect(
        typeof (await request(app.getHttpServer()).get('/constants')).body
          .tokenGated,
      ).toEqual('undefined');

      enableGate();
      expect(
        (await request(app.getHttpServer()).get('/constants')).body.tokenGated,
      ).toEqual(true);
    });

    it('owned tokens should be empty when not logged in', async () => {
      enableGate();

      expect(await getUserTokens(app)).toEqual([]);
    });

    it('enabling the token gate should block out not logged in users', async () => {
      expect(
        (await request(app.getHttpServer()).get(`/nfts/${nftIds[0]}`))
          .statusCode,
      ).toEqual(200);

      enableGate();

      expect(await getEndpointInfo(app, `/nfts/${nftIds[0]}`)).toEqual({
        allowedTokens: ['common'],
        userHasAccess: false,
      });

      expect(
        (await request(app.getHttpServer()).get(`/nfts/${nftIds[0]}`))
          .statusCode,
      ).toEqual(403);
    });

    it('logged in user, but without any token, does not get access', async () => {
      enableGate();

      const w = await testUtils.newWallet(app);

      expect(await getUserTokens(app, w)).toEqual([]);
      expect(await getEndpointInfo(app, `/nfts/${nftIds[0]}`, w)).toEqual({
        allowedTokens: ['common'],
        userHasAccess: false,
      });

      const resp = await request(app.getHttpServer())
        .get(`/nfts/${nftIds[0]}`)
        .set('Authorization', w.login.bearer);
      expect(resp.statusCode).toEqual(403);
    });

    it('logged in user with correct token has access', async () => {
      enableGate();

      const w = await testUtils.newWallet(app);
      await testUtils.giveAccessToken(w, 0);

      expect(await getUserTokens(app, w)).toEqual(['common']);
      expect(await getEndpointInfo(app, `/nfts/${nftIds[0]}`, w)).toEqual({
        allowedTokens: ['common'],
        userHasAccess: true,
      });

      const resp = await request(app.getHttpServer())
        .get(`/nfts/${nftIds[0]}`)
        .set('Authorization', w.login.bearer);
      expect(resp.statusCode).toEqual(200);
    });

    it('logged in user with a token, but a wrong one, does not get access', async () => {
      enableGate();

      const w = await testUtils.newWallet(app);
      await testUtils.giveAccessToken(w, 1);

      expect(await getUserTokens(app, w)).toEqual(['rare']);
      expect(await getEndpointInfo(app, `/nfts/${nftIds[0]}`, w)).toEqual({
        allowedTokens: ['common'],
        userHasAccess: false,
      });

      const resp = await request(app.getHttpServer())
        .get(`/nfts/${nftIds[0]}`)
        .set('Authorization', w.login.bearer);
      expect(resp.statusCode).toEqual(403);
    });

    it('trailing / endpoint gets token gated on non-trailing / variant', async () => {
      enableGate();

      const w = await testUtils.newWallet(app);
      await testUtils.giveAccessToken(w, 0);

      expect(await getUserTokens(app, w)).toEqual(['common']);
      expect(await getEndpointInfo(app, `/nfts/`, w)).toEqual({
        allowedTokens: ['rare'],
        userHasAccess: false,
      });

      const resp = await request(app.getHttpServer())
        .get(`/nfts/`)
        .set('Authorization', w.login.bearer);
      expect(resp.statusCode).toEqual(403);
    });
  });
}

async function getUserTokens(app: any, w?: testUtils.Wallet) {
  if (typeof w !== 'undefined') {
    const resp = await request(app.getHttpServer())
      .get('/auth/token-gate/tokens')
      .set('Authorization', w.login.bearer);
    return resp.body;
  }
  const resp = await request(app.getHttpServer()).get(
    '/auth/token-gate/tokens',
  );
  return resp.body;
}

async function getEndpointInfo(
  app: any,
  endpoint: string,
  w?: testUtils.Wallet,
) {
  if (typeof w !== 'undefined') {
    const resp = await request(app.getHttpServer())
      .get('/auth/token-gate/endpoint')
      .query({
        endpoint,
      })
      .set('Authorization', w.login.bearer);
    return resp.body;
  }
  const resp = await request(app.getHttpServer())
    .get('/auth/token-gate/endpoint')
    .query({
      endpoint,
    });
  return resp.body;
}
