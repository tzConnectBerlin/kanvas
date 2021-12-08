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
console.debug('PORT IS', Number(assertEnv('DB_PORT')));

export const dbPool = new Pool({
  host: assertEnv('DB_HOST'),
  port: Number(assertEnv('DB_PORT')),
  user: assertEnv('DB_USERNAME'),
  password: assertEnv('DB_PASSWORD'),
  database: assertEnv('DB_DATABASE'),
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
