import { Test, TestingModule } from '@nestjs/testing';
import { DbModule, DbPool, withMutexLock, DbTransaction } from './db.module';
import { PG_CONNECTION } from './constants';

describe('DbModule', () => {
  let db: DbPool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbModule],
    }).compile();

    db = module.get(PG_CONNECTION);
  });

  it('should be defined', () => {
    expect(db).toBeDefined();
  });

  it('db mutex lock', async () => {
    await withMutexLock({
      dbPool: db,
      mutexName: 'm1',
      f: async (dbTx: DbTransaction) => {
        return 0;
      },
    });
  });
});
