import { Module } from '@nestjs/common';
import { PG_CONNECTION } from 'src/constants';

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
