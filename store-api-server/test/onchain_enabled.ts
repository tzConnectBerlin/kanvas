import request from 'supertest';
import Pool from 'pg-pool';
import sotez from 'sotez';
const { cryptoUtils } = sotez;
import { readFileSync } from 'fs';

import { assertEnv, sleep } from '../src/utils';

export async function runOnchainEnabledTests(appReference: () => any) {
  let app: any;
  let nftIds: number[];

  describe('clean e2e test cases (db is reset between each test)', () => {
    beforeEach(async () => {
      app = appReference();
      nftIds = await resetDb();
    });
    afterAll(async () => {
      app = appReference();
      await resetDb(true);
    });

    it('test', async () => {
      const wallet1 = await newWallet(app);
    });
  });
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

  const nftIds = (await db.query(`SELECT id FROM nft`)).rows.map(
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
