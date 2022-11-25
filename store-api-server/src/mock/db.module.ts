import { Module } from '@nestjs/common';
import { PG_CONNECTION } from '../constants.js';

class DbConnMock {
  query() {}
  release() {}
}

class DbPoolMock {
  connect() {
    return new DbConnMock();
  }
}

const dbMockProvider = {
  provide: PG_CONNECTION,
  useValue: new DbPoolMock(),
};

@Module({
  providers: [dbMockProvider],
  exports: [dbMockProvider],
})
export class DbMock {}
