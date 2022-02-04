import { Module } from '@nestjs/common';
import { PG_CONNECTION, PG_CONNECTION_STORE_REPLICATION } from './constants';

class dbConnMock {}

const dbMockProvider = {
  provide: PG_CONNECTION,
  useValue: new dbConnMock(),
};

const dbMockStoreReplProvider = {
  provide: PG_CONNECTION_STORE_REPLICATION,
  useValue: new dbConnMock(),
};

@Module({
  providers: [dbMockProvider, dbMockStoreReplProvider],
  exports: [dbMockProvider, dbMockStoreReplProvider],
})
export class DbMockModule {}
