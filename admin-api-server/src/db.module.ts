import { Module, Logger, Inject } from '@nestjs/common';
import { Client } from 'pg';
import pg from 'pg';
const { types } = pg;
import Pool from 'pg-pool';

import { assertEnv } from './utils.js';
import { PG_CONNECTION, PG_CONNECTION_STORE } from './constants.js';

export type DbPool = Pool<Client>;

// Read postgres TIMESTAMP WITHOUT TIME ZONE values as UTC+0 Date
types.setTypeParser(
  1114 /* TIMESTAMP without time zone type */,
  function (stringValue: string) {
    return new Date(stringValue + '+0000');
  },
);

interface Wrap {
  dbPool?: DbPool;
  storeDbPool?: DbPool;
}

const wrapPool = {
  provide: 'PG_POOL_WRAP',
  useValue: <Wrap>{ dbPool: undefined, storeDbPool: undefined },
};

const dbProvider = {
  provide: PG_CONNECTION,
  inject: ['PG_POOL_WRAP'],
  useFactory: async (w: Wrap) => {
    if (typeof w.dbPool !== 'undefined') {
      return w.dbPool;
    }
    w.dbPool = new Pool({
      host: assertEnv('PGHOST'),
      port: Number(assertEnv('PGPORT')),
      user: assertEnv('PGUSER'),
      password: assertEnv('PGPASSWORD'),
      database: assertEnv('PGDATABASE'),
    });
    return w.dbPool;
  },
};

const dbStoreProvider = {
  provide: PG_CONNECTION_STORE,
  inject: ['PG_POOL_WRAP'],
  useFactory: async (w: Wrap) => {
    if (typeof w.storeDbPool !== 'undefined') {
      return w.storeDbPool;
    }
    w.storeDbPool = new Pool({
      host: assertEnv('STORE_PGHOST'),
      port: Number(assertEnv('STORE_PGPORT')),
      user: assertEnv('STORE_PGUSER'),
      password: assertEnv('STORE_PGPASSWORD'),
      database: assertEnv('STORE_PGDATABASE'),
    });
    return w.storeDbPool;
  },
};

@Module({
  providers: [wrapPool, dbProvider, dbStoreProvider],
  exports: [dbProvider, dbStoreProvider],
})
export class DbModule {
  constructor(@Inject('PG_POOL_WRAP') private w: Wrap) {}

  async onModuleDestroy() {
    Logger.log('closing db connection..');

    if (typeof this.w.dbPool === 'undefined') {
      Logger.warn(
        `dbPool already uninitialized! stacktrace: ${new Error().stack}`,
      );
    } else {
      await this.w.dbPool.end();
      this.w.dbPool = undefined;
    }
    if (typeof this.w.storeDbPool === 'undefined') {
      Logger.warn(
        `storeDbPool already uninitialized! stacktrace: ${new Error().stack}`,
      );
    } else {
      await this.w.storeDbPool.end();
      this.w.storeDbPool = undefined;
    }
    Logger.log('db connection closed');
  }
}
