import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { assertEnv } from './utils';
import {
  PG_CONNECTION,
  PG_CONNECTION_STORE_REPLICATION,
  PG_CONNECTION_STORE,
} from './constants';
import { Client, types } from 'pg';
import * as Pool from 'pg-pool';
export type DbPool = Pool<Client>;

dotenv.config();

// Read postgres TIMESTAMP WITHOUT TIME ZONE values as UTC+0 Date
types.setTypeParser(
  1114 /* TIMESTAMP without time zone type */,
  function (stringValue: string) {
    return new Date(stringValue + '+0000');
  },
);

export const dbPool = new Pool({
  host: assertEnv('PGHOST'),
  port: Number(assertEnv('PGPORT')),
  user: assertEnv('PGUSER'),
  password: assertEnv('PGPASSWORD'),
  database: assertEnv('PGDATABASE'),
});
const dbProvider = {
  provide: PG_CONNECTION,
  useValue: dbPool,
};

export const storeReplDbPool = new Pool({
  host: assertEnv('PGHOST'),
  port: Number(assertEnv('PGPORT')),
  user: assertEnv('PGUSER'),
  password: assertEnv('PGPASSWORD'),
  database: 'store_replication',
});
const dbStoreReplProvider = {
  provide: PG_CONNECTION_STORE_REPLICATION,
  useValue: storeReplDbPool,
};

const dbStoreProvider = {
  provide: PG_CONNECTION_STORE,
  useValue: new Pool({
    host: assertEnv('STORE_PGHOST'),
    port: Number(assertEnv('STORE_PGPORT')),
    user: assertEnv('STORE_PGUSER'),
    password: assertEnv('STORE_PGPASSWORD'),
    database: assertEnv('STORE_PGDATABASE'),
  }),
};

@Module({
  providers: [dbProvider, dbStoreReplProvider, dbStoreProvider],
  exports: [dbProvider, dbStoreReplProvider, dbStoreProvider],
})
export class DbModule {}
