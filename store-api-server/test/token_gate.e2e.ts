import request from 'supertest';

import { PaymentService } from '../src/payment/service/payment.service';
import {
  OrderStatus,
  PaymentStatus,
} from '../src/payment/entity/payment.entity.js';
import { assertEnv } from '../src/utils';

import * as testUtils from './utils';

export async function runTokenGateTests(appReference: () => any) {
  let app: any;
  let nftIds: number[];

  describe('clean e2e test cases (db is reset between each test)', () => {
    beforeEach(async () => {
      [app] = appReference();
      nftIds = await testUtils.resetDb();
    });
    afterAll(async () => {
      await testUtils.resetDb(true);
    });

    it('', async () => {});
  });
}
