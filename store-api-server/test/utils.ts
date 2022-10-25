import Pool from 'pg-pool';
import { readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import request from 'supertest';
import sotez from 'sotez';
import { Client } from 'pg';
const { cryptoUtils } = sotez;
import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';

import { PaymentService } from '../src/payment/service/payment.service';
import {
  PaymentProvider,
  PaymentStatus,
  OrderInfo,
} from '../src/payment/entity/payment.entity';
import { UserEntity } from '../src/user/entity/user.entity';
import { assertEnv, sleep } from '../src/utils';
import { SIGNATURE_PREFIX_CREATE_NFT } from 'kanvas-api-lib';

export interface KanvasLogin {
  id: number;
  bearer: string;
}

export interface Wallet {
  sk: string;
  pk: string;
  pkh: string;
  esk: string;
  mnemonic: string;
  login: KanvasLogin;
}

export async function newWallet(
  app: any,
  loadTez = 0,
  awaitTez = true,
): Promise<Wallet> {
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

  if (loadTez > 0) {
    const Tezos = new TezosToolkit(assertEnv('NODE_URL'));

    Tezos.setProvider({
      signer: await InMemorySigner.fromSecretKey(assertEnv('BOB_SK')),
    });
    let transfer = Tezos.wallet
      .transfer({ to: keys.pkh, amount: loadTez })
      .send();
    if (awaitTez) {
      await (await transfer).confirmation(1);
    }
  }

  return {
    ...keys,
    esk: encryptedSecretKey,
    login: {
      bearer: `Bearer ${loginResp.body.token}`,
      id: loginResp.body.id,
    },
  };
}

export async function transferNft(
  fromWallet: Wallet,
  toWalletPkh: string,
  tokenId: number,
) {
  const Tezos = new TezosToolkit(assertEnv('NODE_URL'));

  Tezos.setProvider({
    signer: await InMemorySigner.fromSecretKey(fromWallet.sk),
  });
  const c = await Tezos.contract.at(assertEnv('KANVAS_CONTRACT'));
  let t = await c.methods
    .transfer([
      {
        from_: fromWallet.pkh,
        txs: [{ to_: toWalletPkh, token_id: tokenId, amount: 1 }],
      },
    ])
    .send();
}

export async function waitBlocks(numBlocks = 3) {
  const db = newDbConn();
  const blockNow = async () => {
    return (
      await db.query(
        'SELECT level FROM que_pasa.levels ORDER BY level DESC LIMIT 1',
      )
    ).rows[0]['level'];
  };

  const pollingIntervalMs = 10;

  const blockStart = await blockNow();
  while (blockStart + numBlocks > (await blockNow())) {
    await sleep(pollingIntervalMs);
  }

  await db.end();
}

export async function getProfile(app: any, wallet: Wallet, asLogin = false) {
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

export async function cartAdd(
  app: any,
  nftId: number,
  wallet: Wallet,
  expStatus = 201,
) {
  const resp = await request(app.getHttpServer())
    .post(`/users/cart/add/${nftId}`)
    .set('authorization', wallet.login.bearer);
  expect(resp.statusCode).toEqual(expStatus);
}

export async function cartList(app: any, wallet: Wallet) {
  const resp = await request(app.getHttpServer())
    .get(`/users/cart/list`)
    .set('authorization', wallet.login.bearer);
  expect(resp.statusCode).toEqual(200);
  return resp.body;
}

export async function checkout(
  paymentService: PaymentService,
  wallet: Wallet,
  finalStatus = PaymentStatus.SUCCEEDED,
): Promise<{ paymentId: string }> {
  const usr = <UserEntity>{
    userAddress: wallet.pkh,
    id: wallet.login.id,
  };

  const intentRes = await paymentService.createPayment(
    usr,
    uuidv4(),
    PaymentProvider.TEST,
    'EUR',
    'localhost',
  );
  // creating one more intent to make it more realistic
  await paymentService.createPayment(
    usr,
    uuidv4(),
    PaymentProvider.TEZPAY,
    'XTZ',
    'localhost',
  );

  await paymentService.updatePaymentStatus(intentRes.id, finalStatus, false);
  return { paymentId: intentRes.id };
}

export async function getOrderInfo(
  app: any,
  wallet: Wallet,
  paymentId: string,
  expStatus = 200,
): Promise<OrderInfo> {
  const resp = await request(app.getHttpServer())
    .get(`/payment/order-info/${paymentId}`)
    .set('authorization', wallet.login.bearer);
  expect(resp.statusCode).toEqual(expStatus);
  return resp.body;
}

export async function createNft(app: any, nft: any) {
  let hexMsg = nft.id.toString(16);
  if (hexMsg.length & 1) {
    // hex is of uneven length, sotez expects an even number of hexadecimal characters
    hexMsg = '0' + hexMsg;
  }

  const signed = await cryptoUtils.sign(
    SIGNATURE_PREFIX_CREATE_NFT + hexMsg,
    assertEnv('ADMIN_PRIVATE_KEY'),
  );

  const resp = await request(app.getHttpServer())
    .post('/nfts/create')
    .send({ ...nft, signature: signed.sig });
  expect(resp.statusCode).toEqual(201);
}

export async function createProxiedNft(app: any, nft: any) {
  let hexMsg = nft.id.toString(16);
  if (hexMsg.length & 1) {
    // hex is of uneven length, sotez expects an even number of hexadecimal characters
    hexMsg = '0' + hexMsg;
  }

  const signed = await cryptoUtils.sign(
    SIGNATURE_PREFIX_CREATE_NFT + hexMsg,
    assertEnv('ADMIN_PRIVATE_KEY'),
  );

  const resp = await request(app.getHttpServer())
    .post('/nfts/create-proxied')
    .send({ ...nft, signature: signed.sig });
  expect(resp.statusCode).toEqual(201);
}

export async function withDbConn<ResTy>(
  f: (dbConn: Pool<Client>) => Promise<ResTy>,
): Promise<ResTy> {
  const db = newDbConn();
  try {
    const res = await f(db);
    return res;
  } finally {
    db.end();
  }
}

export async function resetDb(resetForLegacyTest = false): Promise<number[]> {
  return await withDbConn(async (db) => {
    await db.query('update cart_session set order_id = null');

    const tables = [
      'nft_order_delivery',
      'mtm_kanvas_user_nft',
      'mtm_cart_session_nft',
      'mtm_nft_category',
      'mtm_nft_order_nft',
      'payment',
      'nft_order',
      'kanvas_user',
      'cart_session',
      'proxy_unfold',
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

    return nftIds;
  });
}

export function newDbConn(): Pool<Client> {
  return new Pool({
    host: assertEnv('PGHOST'),
    port: Number(assertEnv('PGPORT')),
    user: assertEnv('PGUSER'),
    password: assertEnv('PGPASSWORD'),
    database: assertEnv('PGDATABASE'),
  });
}
export function logFullObject(obj: any) {
  console.log(JSON.stringify(obj, undefined, 2));
}

export async function basicProxySetup(
  app: any,
  newNftId: () => number,
): Promise<{
  proxiedNftIds: number[];
  proxyNftId: number;
  proxyCategoryId: number;
  proxiedCategoryId: number;
}> {
  let proxyCategoryId: any;
  let proxiedCategoryId: any;

  // simpler to run this test with fresh categories
  await withDbConn(async (conn) => {
    proxyCategoryId = (
      await conn.query(`
insert into nft_category (
  category, description
)
values
  ('Root', 'parent category, assigned to the proxy nft')
RETURNING id
`)
    ).rows[0]['id'];
    proxiedCategoryId = (
      await conn.query(
        `
insert into nft_category (
  category, description, parent
)
values
  ('Root', 'leaf category, assigned to the proxied nft', $1)
RETURNING id
`,
        [proxyCategoryId],
      )
    ).rows[0]['id'];
  });

  const proxyNftId = newNftId();
  await createNft(app, {
    id: proxyNftId,
    name: 'the proxy nft',
    description: 'this nft is a proxy',
    price: 5,
    artifactUri: 'proxy_img',
    editionsSize: 0,
    categories: [proxyCategoryId],
  });
  const proxiedNftId0 = newNftId();
  await createProxiedNft(app, {
    id: proxiedNftId0,
    proxyNftId,
    name: 'one of the unfoldings',
    description: 'this nft is proxied',
    artifactUri: 'unfolded_img',
    editionsSize: 0,
    categories: [proxiedCategoryId],
  });
  const proxiedNftId1 = newNftId();
  await createProxiedNft(app, {
    id: proxiedNftId1,
    proxyNftId,
    name: 'another of the unfoldings',
    description: 'this nft is proxied',
    artifactUri: 'unfolded_img2',
    editionsSize: 0,
    categories: [proxiedCategoryId],
  });

  return {
    proxyNftId,
    proxiedNftIds: [proxiedNftId0, proxiedNftId1],
    proxyCategoryId,
    proxiedCategoryId,
  };
}
