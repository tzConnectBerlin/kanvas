import { Module } from '@nestjs/common';
import { assertEnv } from './utils';
import { PG_CONNECTION } from './constants';
import { Pool, types } from 'pg';

// Read postgres TIMESTAMP WITHOUT TIME ZONE values as UTC+0 Date
types.setTypeParser(
  1114 /* TIMESTAMP WITHOUT TIME ZONE type */,
  function (stringValue: string) {
    return new Date(stringValue + '+0000');
  },
);

const dbProvider = {
  provide: PG_CONNECTION,
  useValue: new Pool({
    host: assertEnv('PGHOST'),
    port: Number(assertEnv('PGPORT')),
    user: assertEnv('PGUSER'),
    password: assertEnv('PGPASSWORD'),
    database: assertEnv('PGDATABASE'),
  }),
};

@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DbModule {}
