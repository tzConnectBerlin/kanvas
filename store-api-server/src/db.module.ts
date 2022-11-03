import { Logger, Module, Inject } from '@nestjs/common';
import { Client, PoolClient } from 'pg';
import pg from 'pg';
const { types } = pg;
import Pool from 'pg-pool';
import { assertEnv } from './utils.js';
import { PG_CONNECTION, PG_LOCK_NOT_AVAILABLE } from './constants.js';

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
  await dbTx.query('BEGIN');
  try {
    const res = await f(dbTx);
    await dbTx.query('COMMIT');
    return res;
  } catch (err: any) {
    await dbTx.query('ROLLBACK');
    throw err;
  } finally {
    dbTx.release();
  }
}

export async function withMutexLock<ResTy>({
  mutexName,
  dbPool,
  f,
  onLockedReturn,
}: {
  mutexName: string;
  dbPool: DbPool;
  f: (dbTx: DbTransaction) => Promise<ResTy>;
  onLockedReturn?: ResTy;
}): Promise<ResTy> {
  const noWait = typeof onLockedReturn !== 'undefined';

  return await withTransaction(dbPool, async (dbTx: DbTransaction) => {
    const claimQry = await dbTx.query(
      `SELECT FROM mutex WHERE name = $1 FOR UPDATE ${noWait ? 'NOWAIT' : ''}`,
      [mutexName],
    );
    if (claimQry.rowCount === 0) {
      const createQry = await dbTx.query(
        'INSERT INTO mutex (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [mutexName],
      );
      if (noWait && createQry.rowCount === 0) {
        throw {
          message: `duplicate mutex creation of ${mutexName}`,
          code: PG_LOCK_NOT_AVAILABLE,
        };
      }
    }

    Logger.log(`executing with db mutex ${mutexName}..`);
    const res = await f(dbTx);

    await dbTx.query(
      `UPDATE mutex SET last_lock = now() AT TIME ZONE 'utc' WHERE name = $1`,
      [mutexName],
    );
    return res;
  }).catch((err: any) => {
    if (noWait && err?.code === PG_LOCK_NOT_AVAILABLE) {
      return onLockedReturn;
    }
    throw err;
  });
}
