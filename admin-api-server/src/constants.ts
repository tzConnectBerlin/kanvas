export const PG_CONNECTION = 'PG_CONNECTION';
export const PG_CONNECTION_STORE_REPLICATION =
  'PG_CONNECTION_STORE_REPLICATION';

export const PG_UNIQUE_VIOLATION_ERRCODE = '23505';
export const AUTH_SALT_ROUNDS = 10;

export const FILE_MAX_BYTES: number = 1000 * 1000 * 2;
export const FILE_PREFIX = 'NFT_FILE_';
export const MAX_FILE_UPLOADS_PER_CALL = 5;
export const ALLOWED_FILE_MIMETYPES = ['image/png'];

export const RATE_LIMIT_WINDOW_SECS = Number(
  process.env['RATE_LIMIT_WINDOW_SECS'] || 60,
);
export const RATE_LIMIT = Number(process.env['RATE_LIMIT'] || 100);
