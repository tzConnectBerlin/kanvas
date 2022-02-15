import { Module } from '@nestjs/common';
import {
  PG_CONNECTION,
  PG_CONNECTION_STORE_REPLICATION,
  PG_CONNECTION_STORE,
} from './constants';

class dbConnMock {}

const dbMockProvider = {
  provide: PG_CONNECTION,
  useValue: new dbConnMock(),
};

const dbMockStoreReplProvider = {
  provide: PG_CONNECTION_STORE_REPLICATION,
  useValue: new dbConnMock(),
};

const dbMockStoreProvider = {
  provide: PG_CONNECTION_STORE,
  useValue: new dbConnMock(),
};

@Module({
  providers: [dbMockProvider, dbMockStoreReplProvider, dbMockStoreProvider],
  exports: [dbMockProvider, dbMockStoreReplProvider, dbMockStoreProvider],
})
export class DbMockModule {}
