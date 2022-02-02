import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { assertEnv } from './utils';
import { PG_CONNECTION, PG_CONNECTION_STORE_REPLICATION } from './constants';
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

const dbStoreProvider = {
  provide: PG_CONNECTION_STORE_REPLICATION,
  useValue: new Pool({
    host: assertEnv('PGHOST'),
    port: Number(assertEnv('PGPORT')),
    user: assertEnv('PGUSER'),
    password: assertEnv('PGPASSWORD'),
    database: 'store_replication',
  }),
};

@Module({
  providers: [dbProvider, dbStoreProvider],
  exports: [dbProvider, dbStoreProvider],
})
export class DbModule {}
