import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { assertEnv } from './utils';
import { PG_CONNECTION } from './constants';
import { Client, types } from 'pg';
import * as Pool from 'pg-pool';

dotenv.config();

export type DbPool = Pool<Client>;

// Read postgres TIMESTAMP WITHOUT TIME ZONE values as UTC+0 Date
types.setTypeParser(
  1114 /* TIMESTAMP without time zone type */,
  function (stringValue: string) {
    return new Date(stringValue + '+0000');
  },
);
console.debug('PORT IS', Number(assertEnv('PGPORT')));

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

@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DbModule {}
