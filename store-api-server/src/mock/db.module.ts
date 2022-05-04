import { Module } from '@nestjs/common';
import { PG_CONNECTION } from '../constants.js';

class dbConnMock {}

const dbMockProvider = {
  provide: PG_CONNECTION,
  useValue: new dbConnMock(),
};

@Module({
  providers: [dbMockProvider],
  exports: [dbMockProvider],
})
export class DbMock {}
