import { Client, PoolClient } from 'pg';
import Pool from 'pg-pool';

export type DbPool = Pool<Client>;
export type DbTransaction = PoolClient;

export function isBottom(v: any): boolean {
  // note: v here is checked for Javascripts' bottom values (null and undefined)
  //       because undefined coerces into null. It's safe because nothing
  //       else coerces into null (other than null itself).
  return v == null;
}

export function maybe<T, Res>(f: (x: T) => Res, x: T | undefined): Res | undefined {
  if (isBottom(x)) {
    return undefined;
  }

  return f(x!);
};

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
