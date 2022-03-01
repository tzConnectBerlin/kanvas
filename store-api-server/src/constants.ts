import { assertEnv } from './utils';

export const PG_CONNECTION = 'PG_CONNECTION';

// source: https://www.postgresql.org/docs/current/errcodes-appendix.html
export const PG_FOREIGN_KEY_VIOLATION_ERRCODE = '23503';
export const PG_UNIQUE_VIOLATION_ERRCODE = '23505';

export const PROFILE_PICTURE_MAX_BYTES: number = 1000 * 1000 * 2; // 2MB

export const SEARCH_MAX_NFTS = 3;
export const SEARCH_MAX_CATEGORIES = 6;
export const SEARCH_SIMILARITY_LIMIT = 0.4;

export const MINTER_ADDRESS = assertEnv('MINTER_TZ_ADDRESS');
export const STORE_PUBLISHERS = ['Tezos'];

export const RATE_LIMIT_TTL = Number(process.env['RATE_LIMIT_TTL'] || 60); // in seconds
export const RATE_LIMIT = Number(process.env['RATE_LIMIT'] || 100);

export const CACHE_TTL = Number(process.env['CACHE_TTL'] || 60); // in seconds
export const CACHE_SIZE = Number(process.env['CACHE_SIZE'] || 10_000); // in max number of items in the cache

export const NUM_TOP_BUYERS = 12;
