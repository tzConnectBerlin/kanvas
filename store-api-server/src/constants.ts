import { assertEnv } from './utils.js';

export const PG_CONNECTION = 'PG_CONNECTION';

// source: https://www.postgresql.org/docs/current/errcodes-appendix.html
export const PG_FOREIGN_KEY_VIOLATION_ERRCODE = '23503';
export const PG_UNIQUE_VIOLATION_ERRCODE = '23505';

export const PROFILE_PICTURE_MAX_BYTES: number = 1000 * 1000 * 2; // 2MB

export const SEARCH_MAX_NFTS = 3;
export const SEARCH_MAX_CATEGORIES = 6;
export const SEARCH_SIMILARITY_LIMIT = 0.4;

export const MINTER_ADDRESS = assertEnv('MINTER_TZ_ADDRESS');
export const ADMIN_PUBLIC_KEY = assertEnv('ADMIN_PUBLIC_KEY'); // this probably should be the revealed public key associated to the MINTER_ADDRESS (MINTER_ADDRESS is the public key hash)

export const STORE_PUBLISHERS = ['Tezos'];

export const RATE_LIMIT_TTL = Number(process.env['RATE_LIMIT_TTL'] || 60); // in seconds
export const RATE_LIMIT = Number(process.env['RATE_LIMIT'] || 100);

export const CACHE_TTL = Number(process.env['CACHE_TTL'] || 60); // in seconds
export const CACHE_SIZE = Number(process.env['CACHE_SIZE'] || 10_000); // in max number of items in the cache

export const NUM_TOP_BUYERS = 12;

// Enable this when for example NGINX sits between incoming traffic and the API.
// It will enable things like the rate limiter to take the incoming IP address
// from the X-Forwarded-For header.
export const BEHIND_PROXY: boolean =
  (process.env['BEHIND_PROXY'] || 'no') === 'yes';

// See section '8.5.4. Interval Input' in https://www.postgresql.org/docs/9.1/datatype-datetime.html
// for exactly what format this duration string should be in.
export const ENDING_SOON_DURATION = '2 hours';

export const PAYPOINT_SCHEMA = 'paypoint';

export const PROFILE_PICTURES_ENABLED: boolean =
  (process.env['PROFILE_PICTURES_ENABLED'] || 'no') === 'yes';

export const CART_EXPIRATION_MILLI_SECS = Number(
  process.env['CART_EXPIRATION_MILLI_SECS'] || 60 * 60 * 1000,
);
export const PAYMENT_PROMISE_DEADLINE_MILLI_SECS = Number(
  process.env['PAYMENT_PROMISE_DEADLINE_MILLI_SECS'] || 600 * 1000,
);

export const ORDER_EXPIRATION_MILLI_SECS = Number(
  process.env['ORDER_EXPIRATION_MILLI_SECS'] || 3600 * 1000,
);

export const SIGNED_LOGIN_ENABLED: boolean =
  (process.env['SIGNED_LOGIN_ENABLED'] || 'no') === 'yes';
