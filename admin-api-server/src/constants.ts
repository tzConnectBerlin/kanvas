export const PG_CONNECTION = 'PG_CONNECTION';
export const PG_UNIQUE_VIOLATION_ERRCODE = '23505';
export const AUTH_SALT_ROUNDS = 10;
export const NFT_IMAGE_MAX_BYTES: number = 1000 * 1000 * 2;
export const NFT_IMAGE_PREFIX = 'NFT_IMAGE_';

export const RATE_LIMIT_WINDOW_SECS = Number(
  process.env['RATE_LIMIT_WINDOW_SECS'] || 60,
);
export const RATE_LIMIT = Number(process.env['RATE_LIMIT'] || 100);
