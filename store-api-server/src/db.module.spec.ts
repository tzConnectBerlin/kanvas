import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DbModule, DbPool, withMutexLock, DbTransaction } from './db.module';
import { PG_CONNECTION } from './constants';
import { sleep } from './utils';

describe('DbModule', () => {
  let db: DbPool;
  let testMutexes = ['m1', 'm2'];

  beforeAll(async () => {});

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbModule],
    }).compile();

    db = module.get(PG_CONNECTION);

    await Promise.all([
      db.query('DELETE FROM mutex WHERE name = ANY($1)', [testMutexes]),
      db.query(
        'CREATE TABLE IF NOT EXISTS db_tests (n TEXT); DELETE FROM db_tests;',
      ),
    ]);
  });

  it('should be defined', () => {
    expect(db).toBeDefined();
  });

  it('db mutex lock locks & awaits if onLockedReturn is not defined (with new lock)', async () => {
    withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      f: async (dbTx: DbTransaction) => {
        await sleep(150);

        await dbTx.query(`INSERT INTO db_tests VALUES ('exp row')`);
        return 0;
      },
    });

    await sleep(50);
    const got = await withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      f: async (dbTx: DbTransaction) => {
        return (await dbTx.query(`SELECT * FROM db_tests`)).rows;
      },
    });
    expect(got).toStrictEqual([{ n: 'exp row' }]);
  });

  it('db mutex lock locks & awaits if onLockedReturn is not defined (with existing lock)', async () => {
    await withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      f: async () => {},
    });

    withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      f: async (dbTx: DbTransaction) => {
        await sleep(150);

        await dbTx.query(`INSERT INTO db_tests VALUES ('exp row')`);
        return 0;
      },
    });

    await sleep(50);
    const got = await withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      f: async (dbTx: DbTransaction) => {
        return (await dbTx.query(`SELECT * FROM db_tests`)).rows;
      },
    });
    expect(got).toStrictEqual([{ n: 'exp row' }]);
  });

  it('db mutex lock locks & does not await if onLockedReturn is defined (with new lock)', async () => {
    withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      f: async (dbTx: DbTransaction) => {
        await sleep(150);

        await dbTx.query(`INSERT INTO db_tests VALUES ('exp row')`);
        return 0;
      },
    });

    await sleep(50);
    const got = await withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      onLockedReturn: 'did not execute',
      f: async () => {
        return 'did execute';
      },
    });
    expect(got).toStrictEqual('did not execute');
  });

  it('db mutex lock locks & does not await if onLockedReturn is defined (with existing lock)', async () => {
    await withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      f: async () => {},
    });

    withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      f: async () => {
        await sleep(150);
      },
    });

    await sleep(50);
    const got = await withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      onLockedReturn: 'did not execute',
      f: async () => {
        return 'did execute';
      },
    });
    expect(got).toStrictEqual('did not execute');
  });

  it('db mutex lock doesnt lock on different mutex name', async () => {
    withMutexLock({
      dbPool: db,
      mutexName: testMutexes[0],
      f: async () => {
        await sleep(150);
      },
    });

    await sleep(50);
    const got = await withMutexLock({
      dbPool: db,
      mutexName: testMutexes[1],
      onLockedReturn: 'did not execute',
      f: async () => {
        return 'did execute';
      },
    });
    expect(got).toStrictEqual('did execute');
  });

  for (const err of [
    'implementation err',
    new HttpException('some internal error', HttpStatus.INTERNAL_SERVER_ERROR),
  ]) {
    it(`db mutex lock doesnt catch implementation err (with err='${err}')`, async () => {
      await expect(
        withMutexLock({
          dbPool: db,
          mutexName: testMutexes[0],
          f: async () => {
            throw err;
          },
        }),
      ).rejects.toEqual(err);
    });
  }

  it('db mutex lock, OK if new mutex is "created" concurrently (with wait on lock)', async () => {
    const got = await Promise.all([
      withMutexLock({
        dbPool: db,
        mutexName: testMutexes[0],
        f: async () => {
          sleep(50);
          return 0;
        },
      }),
      withMutexLock({
        dbPool: db,
        mutexName: testMutexes[0],
        f: async () => {
          sleep(50);
          return 0;
        },
      }),
    ]);
    expect(got).toStrictEqual([0, 0]);
  });

  it('db mutex lock, OK if new mutex is "created" concurrently (with no wait on lock)', async () => {
    const got = await Promise.all([
      withMutexLock({
        dbPool: db,
        mutexName: testMutexes[0],
        onLockedReturn: 1,
        f: async () => {
          sleep(50);
          return 0;
        },
      }),
      withMutexLock({
        dbPool: db,
        onLockedReturn: 1,
        mutexName: testMutexes[0],
        f: async () => {
          sleep(50);
          return 0;
        },
      }),
    ]);
    expect(got.sort()).toStrictEqual([0, 1]);
  });
});
