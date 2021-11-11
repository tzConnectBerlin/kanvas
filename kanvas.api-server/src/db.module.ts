import { Module } from '@nestjs/common'
import { assertEnv } from './utils'
import { Pool } from 'pg'

export const PG_CONNECTION = 'PG_CONNECTION'
export const PG_UNIQUE_VIOLATION_ERRCODE = '23505'

const dbProvider = {
  provide: PG_CONNECTION,
  useValue: new Pool({
    host: assertEnv('DB_HOST'),
    port: Number(assertEnv('DB_PORT')),
    user: assertEnv('DB_USERNAME'),
    password: assertEnv('DB_PASSWORD'),
    database: assertEnv('DB_DATABASE'),
  }),
}

@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DbModule {}
