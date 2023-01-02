import { Module } from '@nestjs/common';
import { PG_CONNECTION, PG_CONNECTION_STORE } from './constants.js';

class dbConnMock {}

const dbMockProvider = {
  provide: PG_CONNECTION,
  useValue: new dbConnMock(),
};

const dbMockStoreProvider = {
  provide: PG_CONNECTION_STORE,
  useValue: new dbConnMock(),
};

@Module({
  providers: [dbMockProvider, dbMockStoreProvider],
  exports: [dbMockProvider, dbMockStoreProvider],
})
export class DbMockModule {}
