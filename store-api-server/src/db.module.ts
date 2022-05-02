import { Logger, Module, Inject } from '@nestjs/common';
import { Client, PoolClient } from 'pg';
import pg from 'pg';
const { types } = pg;
import Pool from 'pg-pool';
import { assertEnv } from './utils.js';
import { PG_CONNECTION } from './constants.js';

//import Pool = require('pg-pool'); // from 'pg-pool';

export type DbPool = Pool<Client>;
export type DbTransaction = PoolClient;

// Read postgres TIMESTAMP WITHOUT TIME ZONE values as UTC+0 Date
types.setTypeParser(
  1114 /* TIMESTAMP WITHOUT TIME ZONE type */,
  function (stringValue: string) {
    return new Date(stringValue + '+0000');
  },
);

interface Wrap {
  dbPool?: DbPool;
}

const wrapPool = {
  provide: 'PG_POOL_WRAP',
  useValue: <Wrap>{ dbPool: undefined },
};
const dbProvider = {
  provide: PG_CONNECTION,
  inject: ['PG_POOL_WRAP'],
  useFactory: (w: Wrap) => {
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

@Module({
  providers: [wrapPool, dbProvider],
  exports: [dbProvider],
})
export class DbModule {
  constructor(@Inject('PG_POOL_WRAP') private w: Wrap) {}

  async onModuleDestroy() {
    if (typeof this.w.dbPool === 'undefined') {
      Logger.warn(
        `pool already uninitialized! stacktrace: ${new Error().stack}`,
      );
      return;
    }
    Logger.log('closing db connection..');
    await this.w.dbPool.end();
    this.w.dbPool = undefined;
    Logger.log('db connection closed');
  }
}

export async function withTransaction<ResTy>(
  dbPool: DbPool,
  f: (dbTx: DbTransaction) => Promise<ResTy>,
): Promise<ResTy> {
  const dbTx = await dbPool.connect();
  try {
    const res = await f(dbTx);
    await dbTx.query(`COMMIT`);
    return res;
  } catch (err: any) {
    await dbTx.query(`ROLLBACK`);
    throw err;
  } finally {
    dbTx.release();
  }
}
