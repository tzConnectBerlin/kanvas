import request from 'supertest';
import Pool from 'pg-pool';
import { cryptoUtils } from 'sotez';
import { readFileSync } from 'fs';

import { assertEnv, sleep } from '../src/utils';

const bob_tz = process.env['TESTING_BOB_TZ'];

export async function runOnchainEnabledTests(appReference: () => any) {
  let app: any;

  describe('clean e2e test cases (db is reset between each test)', () => {
    beforeEach(async () => {
      app = appReference();
      await resetDb();

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ userAddress: bob_tz, signedPayload: 'verysecret' });
      expect(res.statusCode).toEqual(201);
    });
    afterAll(async () => {
      app = appReference();
      await resetDb();
    });

    it('test', async () => {
      const wallet1 = await genTzAddr();
      console.log(wallet1);
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          userAddress: 'addr',
          signedPayload: 'bad password',
        });
      expect(login.statusCode).toEqual(401);
    });
  });
}

async function resetDb() {
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
ORDER BY S.relname;
    `,
  );
  for (const resetSeq of resetSequencesQryRes.rows) {
    await db.query(resetSeq['sequence']);
  }

  await db.query(
    readFileSync('script/populate-testdb.sql', { encoding: 'utf8' }),
  );

  await db.end();
}

async function genTzAddr() {
  const mnemonic = cryptoUtils.generateMnemonic();
  const keys = await cryptoUtils.generateKeys(mnemonic, 'bip39_seed_password');
  // {
  //   sk: string;
  //   pk: string;
  //   pkh: string;
  // }

  const encryptedSecretKey = cryptoUtils.encryptSecretKey(keys.sk, 'password');

  return {
    ...keys,
    esk: encryptedSecretKey,
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
