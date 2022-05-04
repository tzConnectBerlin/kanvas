import { assertEnv } from './utils';

export const PG_CONNECTION = 'PG_CONNECTION';
export const PG_CONNECTION_STORE_REPLICATION =
  'PG_CONNECTION_STORE_REPLICATION';
export const PG_CONNECTION_STORE = 'PG_CONNECTION_STORE';

export const PG_UNIQUE_VIOLATION_ERRCODE = '23505';
export const AUTH_SALT_ROUNDS = 10;

export const FILE_MAX_BYTES: number = 1000 * 1000 * 20;
export const FILE_PREFIX = 'NFT_FILE_';
export const MAX_FILE_UPLOADS_PER_CALL = 5;
export const ALLOWED_FILE_MIMETYPES = ['image/png', 'image/jpeg'];

export const RATE_LIMIT_WINDOW_SECS = Number(
  process.env['RATE_LIMIT_WINDOW_SECS'] || 60,
);
export const RATE_LIMIT = Number(process.env['RATE_LIMIT'] || 100);

export const STM_CONFIG_FILE =
  process.env['STM_CONFIG_FILE'] || './config/stm_example.yaml';
export const NFT_PUBLISH_STATE = 'finish';
export const NFT_DELIST_STATE = 'delisted';

export const STORE_API = process.env['STORE_API'] || 'http://localhost:3005';

export const ADMIN_PRIVATE_KEY = assertEnv('ADMIN_PRIVATE_KEY');
