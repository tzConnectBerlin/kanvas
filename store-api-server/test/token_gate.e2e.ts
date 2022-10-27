import request from 'supertest';

import { PaymentService } from '../src/payment/service/payment.service';
import {
  OrderStatus,
  PaymentStatus,
} from '../src/payment/entity/payment.entity.js';
import { assertEnv } from '../src/utils';
import { TokenGate } from 'token-gate';

import * as testUtils from './utils';

export async function runTokenGateTests(appReference: () => any) {
  const specDir = 'test/token_gates';
  let app: any;
  let gate: TokenGate;
  let nftIds: number[];

  describe('clean e2e test cases (db is reset between each test)', () => {
    beforeEach(async () => {
      [app, gate] = appReference();
      nftIds = await testUtils.resetDb();
    });
    afterAll(async () => {
      await testUtils.resetDb(true);
      gate.loadSpecFromFile(specDir + '/disabled.yaml');
    });

    it('', async () => {
      expect((await app.get(`/nfts/${nftIds[0]}`)).statusCode).toEqual(200);
      gate.loadSpecFromFile(specDir + '/enabled.yaml');
      expect((await app.get(`/nfts/${nftIds[0]}`)).statusCode).toEqual(403);
    });
  });
}
