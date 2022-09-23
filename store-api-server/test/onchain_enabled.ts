import request from 'supertest';
import Pool from 'pg-pool';
import sotez from 'sotez';
const { cryptoUtils } = sotez;
import { readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

import {
  PaymentService,
  PaymentStatus,
} from '../src/payment/service/payment.service';
import { PaymentProvider } from '../src/payment/entity/payment.entity.js';
import { UserEntity } from '../src/user/entity/user.entity';
import { assertEnv, sleep } from '../src/utils';

export async function runOnchainEnabledTests(appReference: () => any) {
  let app: any;
  let paymentService: PaymentService;
  let nftIds: number[];

  describe('clean e2e test cases (db is reset between each test)', () => {
    beforeEach(async () => {
      [app, paymentService] = appReference();
      nftIds = await resetDb();
    });
    afterAll(async () => {
      await resetDb(true);
    });

    it('paid nft becomes owned after 2 blocks', async () => {
      const wallet1 = await newWallet(app);
      await cartAdd(app, nftIds[0], wallet1);
      await checkout(paymentService, wallet1);

      await waitNextBlock();

      const profile = await getProfile(app, wallet1);
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
      const wallet1 = await newWallet(app);
      await cartAdd(app, nftIds[0], wallet1);
      await checkout(paymentService, wallet1);
      await cartAdd(app, nftIds[0], wallet1);
      await checkout(paymentService, wallet1);

      await waitNextBlock();

      const profile = await getProfile(app, wallet1);
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
  });
}

async function waitNextBlock() {
  const db = newDbConn();
  const blockNow = async () => {
    return (
      await db.query(
        'SELECT level FROM que_pasa.levels ORDER BY level DESC LIMIT 1',
      )
    ).rows[0]['level'];
  };

  const pollingIntervalMs = 10;
  const waitBlocks = 3;

  const blockStart = await blockNow();
  while (blockStart + waitBlocks > (await blockNow())) {
    await sleep(pollingIntervalMs);
  }
  console.log(`${blockStart},${await blockNow()}`);

  await db.end();
}

async function getProfile(app: any, wallet: Wallet, asLogin = false) {
  let res;
  if (asLogin) {
    res = await request(app.getHttpServer())
      .get('/users/profile')
      .set('authorization', wallet.login.bearer);
  } else {
    res = await request(app.getHttpServer())
      .get('/users/profile')
      .query({ userAddress: wallet.pkh });
  }
  expect(res.status).toEqual(200);
  return res.body;
}

async function cartAdd(app: any, nftId: number, wallet: Wallet) {
  const resp = await request(app.getHttpServer())
    .post(`/users/cart/add/${nftId}`)
    .set('authorization', wallet.login.bearer);
  expect(resp.statusCode).toEqual(201);
}

export async function checkout(paymentService: PaymentService, wallet: Wallet) {
  const usr = <UserEntity>{
    userAddress: wallet.pkh,
    id: wallet.login.id,
  };

  // Create one payment intent (we are not calling the stripe api)
  const intentRes = await paymentService.createPayment(
    usr,
    uuidv4(),
    PaymentProvider.TEST,
    'EUR',
    'localhost',
  );

  // Give webhook handler function success event
  const { paymentId } = await paymentService.getPaymentForLatestUserOrder(
    wallet.login.id,
  );

  await paymentService.updatePaymentStatus(
    paymentId,
    PaymentStatus.SUCCEEDED,
    false,
  );
}

async function resetDb(resetForLegacyTest = false): Promise<number[]> {
  const db = newDbConn();

  const tables = [
    'mtm_kanvas_user_nft',
    'mtm_cart_session_nft',
    'mtm_nft_category',
    'mtm_nft_order_nft',
    'payment',
    'nft_order',
    'kanvas_user',
    'cart_session',
    'nft',
    'nft_category',
  ];

  for (const t of tables) {
    await db.query(`delete from ${t}`);
  }

  const resetSequencesQryRes = await db.query(
    `
SELECT 'alter sequence ' || S.relname || ' restart;' AS sequence
FROM pg_class AS S, pg_depend AS D, pg_class AS T, pg_attribute AS C, pg_tables AS PGT
WHERE S.relkind = 'S'
    AND S.oid = D.objid
    AND D.refobjid = T.oid
    AND D.refobjid = C.attrelid
    AND D.refobjsubid = C.attnum
    AND T.relname = PGT.tablename
    AND PGT.schemaname = 'public'
    ${
      !resetForLegacyTest
        ? // need to increment nft ids, hence exclusion of nft table below.
          // because: if we don't increment nft ids, next tests will depend on
          // previous tests' onchain side effects due to minted nfts having the
          // same token id as the nft id
          "AND PGT.tablename != 'nft'"
        : ''
    }
ORDER BY S.relname;
    `,
  );
  for (const resetSeq of resetSequencesQryRes.rows) {
    await db.query(resetSeq['sequence']);
  }

  await db.query(
    readFileSync('script/populate-testdb.sql', { encoding: 'utf8' }),
  );

  const nftIds = (await db.query(`SELECT id FROM nft ORDER BY id`)).rows.map(
    (row: any) => row['id'],
  );

  await db.end();
  return nftIds;
}

interface Wallet {
  sk: string;
  pk: string;
  pkh: string;
  esk: string;
  mnemonic: string;
  login: KanvasLogin;
}

interface KanvasLogin {
  id: number;
  bearer: string;
}

async function newWallet(app: any): Promise<Wallet> {
  const mnemonic = cryptoUtils.generateMnemonic();
  const keys = await cryptoUtils.generateKeys(mnemonic, 'bip39_seed_password');

  const encryptedSecretKey = cryptoUtils.encryptSecretKey(keys.sk, 'password');

  const registrationResp = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      userAddress: keys.pkh,
      signedPayload: 'pass',
    });
  expect(registrationResp.statusCode).toEqual(201);

  const loginResp = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      userAddress: keys.pkh,
      signedPayload: 'pass',
    });
  expect(loginResp.statusCode).toEqual(201);

  return {
    ...keys,
    esk: encryptedSecretKey,
    login: {
      bearer: `Bearer ${loginResp.body.token}`,
      id: loginResp.body.id,
    },
  };
}

function newDbConn() {
  return new Pool({
    host: assertEnv('PGHOST'),
    port: Number(assertEnv('PGPORT')),
    user: assertEnv('PGUSER'),
    password: assertEnv('PGPASSWORD'),
    database: assertEnv('PGDATABASE'),
  });
}

function logFullObject(obj: any) {
  console.log(JSON.stringify(obj, undefined, 2));
}
