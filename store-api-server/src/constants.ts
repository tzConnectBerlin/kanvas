import { assertEnv, maybe } from './utils.js';

export const PG_CONNECTION = 'PG_CONNECTION';
export const IPFS_PIN_PROVIDER = 'IPFS_PIN_PROVIDER';
export const TOKEN_GATE = 'TOKEN_GATE';

// optional token gate, if undefined it is disabled
export const TOKEN_GATE_SPEC_FILE: string | undefined =
  process.env['TOKEN_GATE_SPEC_FILE'];

export const MOCK_IPFS_PINNING: boolean =
  (process.env['MOCK_IPFS_PINNING'] ?? 'no') === 'yes';

// source: https://www.postgresql.org/docs/current/errcodes-appendix.html
export const PG_FOREIGN_KEY_VIOLATION_ERRCODE = '23503';
export const PG_UNIQUE_VIOLATION_ERRCODE = '23505';
export const PG_LOCK_NOT_AVAILABLE = '55P03';

export const PROFILE_PICTURE_MAX_BYTES: number = 1000 * 1000 * 2; // 2MB

export const SEARCH_MAX_NFTS = 3;
export const SEARCH_MAX_CATEGORIES = 6;
export const SEARCH_SIMILARITY_LIMIT = 0.4;

export const TEZOS_NETWORK = assertEnv('TEZOS_NETWORK');
export const KANVAS_CONTRACT = assertEnv('KANVAS_CONTRACT');
export const MINTER_ADDRESS = assertEnv('MINTER_TZ_ADDRESS');
export const ADMIN_PUBLIC_KEY = assertEnv('ADMIN_PUBLIC_KEY'); // this should be the revealed public key associated to the MINTER_ADDRESS (MINTER_ADDRESS is the public key hash)

export const ROYALTIES_RECEIVER =
  process.env['ROYALTIES_RECEIVER'] ?? MINTER_ADDRESS;
export const DEFAULT_ROYALTIES_MINTER_SHARE = 10;

export const STORE_PUBLISHERS = ['Tezos'];

export const IPFS_RIGHTS_URI: string | undefined =
  process.env['IPFS_RIGHTS_URI'];
export const IPFS_RIGHTS_MIMETYPE: string | undefined =
  typeof IPFS_RIGHTS_URI === 'undefined'
    ? undefined
    : assertEnv('IPFS_RIGHTS_MIMETYPE');

export const RATE_LIMIT_TTL = Number(process.env['RATE_LIMIT_TTL'] ?? 60); // in seconds
export const RATE_LIMIT = Number(process.env['RATE_LIMIT'] ?? 100);

export const CACHE_TTL = Number(process.env['CACHE_TTL'] ?? 60); // in seconds
export const CACHE_SIZE = Number(process.env['CACHE_SIZE'] ?? 10_000); // in max number of items in the cache

export const NUM_TOP_BUYERS = 12;

export const SECURE_COOKIE_SETTINGS: boolean =
  (process.env['SECURE_COOKIE_SETTINGS'] ?? 'no') === 'yes';

// Enable this when for example NGINX sits between incoming traffic and the API.
// It will enable things like the rate limiter to take the incoming IP address
// from the X-Forwarded-For header.
export const BEHIND_PROXY: boolean =
  (process.env['BEHIND_PROXY'] ?? 'no') === 'yes';
// if LOCAL_CORS is true, the API will set CORS related response headers (usually should be kept default as the inverse of BEHIND_PROXY)
export const LOCAL_CORS: boolean =
  maybe(
    process.env.LOCAL_CORS,
    (cors_env) =>
      cors_env === 'yes' ||
      cors_env === 'true' /* note: true value here is deprecated */,
  ) ?? !BEHIND_PROXY;

// See section '8.5.4. Interval Input' in https://www.postgresql.org/docs/9.1/datatype-datetime.html
// for exactly what format this duration string should be in.
export const ENDING_SOON_DURATION = '2 hours';

export const PAYPOINT_SCHEMA = 'paypoint';

export const PROFILE_PICTURES_ENABLED: boolean =
  (process.env['PROFILE_PICTURES_ENABLED'] ?? 'no') === 'yes';

export const CART_EXPIRATION_MILLI_SECS = Number(
  process.env['CART_EXPIRATION_MILLI_SECS'] ?? 60 * 60 * 1000,
);
export const PAYMENT_PROMISE_DEADLINE_MILLI_SECS = Number(
  process.env['PAYMENT_PROMISE_DEADLINE_MILLI_SECS'] ?? 600 * 1000,
);

export const ORDER_EXPIRATION_MILLI_SECS = Number(
  process.env['ORDER_EXPIRATION_MILLI_SECS'] ?? 3600 * 1000,
);

export const WERT_PRIV_KEY: string | undefined = process.env['WERT_PRIV_KEY'];
export const WERT_PUB_KEY: string | undefined = process.env['WERT_PUB_KEY'];
export const WERT_ALLOWED_FIAT: string[] = ['USD']; // it seems that as for now at least wert only supports payments in USD

export const SIMPLEX_API_KEY: string | undefined =
  process.env['SIMPLEX_API_KEY'];
export const SIMPLEX_API_URL: string | undefined =
  process.env['SIMPLEX_API_URL'];
export const SIMPLEX_PUBLIC_KEY: string | undefined =
  process.env['SIMPLEX_PUBLIC_KEY'];
export const SIMPLEX_WALLET_ID: string | undefined =
  process.env['SIMPLEX_WALLET_ID'];
export const SIMPLEX_ALLOWED_FIAT: string[] = ['USD']; // it seems that as for now at least simplex only supports payments in USD

export const TEZPAY_PAYPOINT_ADDRESS: string | undefined =
  process.env['TEZPAY_PAYPOINT_ADDRESS'];

export const SIGNED_LOGIN_ENABLED: boolean =
  (process.env['SIGNED_LOGIN_ENABLED'] ?? 'no') === 'yes';

export const CART_MAX_ITEMS: number = Number(
  process.env['CART_MAX_ITEMS'] ?? 10,
);

// Share this secret with trusted API clients. Clients that provide this
// secret in their API calls are not rate limited.
export const API_KEY_SECRET: string | undefined = process.env['API_KEY_SECRET'];

export const STRIPE_SECRET: string | undefined = process.env['STRIPE_SECRET'];
export const STRIPE_WEBHOOK_SECRET: string | undefined =
  process.env['STRIPE_WEBHOOK_SECRET'];

export const STRIPE_PAYMENT_METHODS: string[] = ['card'];

export const STRIPE_CHECKOUT_ENABLED: boolean =
  (process.env['STRIPE_CHECKOUT_ENABLED'] || 'no') === 'yes';

export const STORE_FRONT_URL: string | undefined =
  process.env['STORE_FRONT_URL'];

export const PINATA_API_KEY: string | undefined = process.env['PINATA_API_KEY'];
export const PINATA_API_SECRET: string | undefined =
  process.env['PINATA_API_SECRET'];

export const VAT_FALLBACK_COUNTRY_SHORT: string =
  process.env['VAT_FALLBACK_COUNTRY_SHORT'] ?? 'GB';

// Phase 2 TOKEN_ID
export const PHASE2_TOKEN_ID: Record<string, number> = {
  A: parseInt(process.env['A_TOKEN_ID'] ?? '1', 10),
  B: parseInt(process.env['B_TOKEN_ID'] ?? '2', 10),
  C: parseInt(process.env['C_TOKEN_ID'] ?? '3', 10),
};

export const TOKEN_ARTIFACT: Record<string, string> = {
  CLASSIC: 'QmYjCgwNQ69QJDSKADQNu638i2tQ2Q5LNL1iiedQrsAXLg',
  RARE: 'QmS9p3HfpASABwRdsxbb4UspogzTZtogobP5uX2GttKJwj',
  ULTRA_RARE: 'QmXSLJhunfxWK14puZmwn3WA1QSSy28C89uzcqDKk6UUXY',
};

export const LEDGER_ADDRESS_COLUMN: string =
  process.env['LEDGER_ADDRESS_COLUMN'] ?? 'idx_assets_address';
export const LEDGER_TOKEN_COLUMN: string =
  process.env['LEDGER_TOKEN_COLUMN'] ?? 'idx_assets_nat';
export const LEDGER_AMOUNT_COLUMN: string =
  process.env['LEDGER_AMOUNT_COLUMN'] ?? 'assets_nat';

export const TOKEN_METADATA_TOKEN_COLUMN: string =
  process.env['TOKEN_METADATA_TOKEN_COLUMN'] ?? 'idx_assets_nat';
