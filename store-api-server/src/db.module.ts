import { Logger, Module, Inject } from '@nestjs/common';
import { assertEnv } from './utils';
import { PG_CONNECTION } from './constants';
import { Pool, types } from 'pg';

// Read postgres TIMESTAMP WITHOUT TIME ZONE values as UTC+0 Date
types.setTypeParser(
  1114 /* TIMESTAMP WITHOUT TIME ZONE type */,
  function (stringValue: string) {
    return new Date(stringValue + '+0000');
  },
);

const dbWrap = {
  provide: 'PG_CONNECTION_WRAP',
  useValue: { pool: null },
};
const dbProvider = {
  provide: PG_CONNECTION,
  inject: ['PG_CONNECTION_WRAP'],
  useFactory: (wrap: any) => {
    if (wrap.pool) {
      return wrap.pool;
    }
    wrap.pool = new Pool({
      host: assertEnv('PGHOST'),
      port: Number(assertEnv('PGPORT')),
      user: assertEnv('PGUSER'),
      password: assertEnv('PGPASSWORD'),
      database: assertEnv('PGDATABASE'),
    });
    return wrap.pool;
  },
};

@Module({
  providers: [dbWrap, dbProvider],
  exports: [dbProvider],
})
export class DbModule {
  constructor(@Inject('PG_CONNECTION_WRAP') private wrap: any) {}

  async onModuleDestroy() {
    if (this.wrap.pool == null) {
      console.log(
        `pool already uninitialized! stacktrace: ${new Error().stack}`,
      );
      return;
    }
    Logger.log('shutting down the pg connection pool..');
    await this.wrap.pool.end();
    this.wrap.pool = null;
    Logger.log('pg connection closed');
  }
}
