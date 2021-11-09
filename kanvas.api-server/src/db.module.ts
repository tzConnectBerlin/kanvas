import { Module } from '@nestjs/common'
import { assertEnv } from 'src/utils'
const postgres = require('postgres')

export const PG_CONNECTION = 'PG_CONNECTION'
export const PG_UNIQUE_VIOLATION_ERRCODE = '23505'

const dbProvider = {
  provide: PG_CONNECTION,
  useValue: postgres({
    host: assertEnv('DB_HOST'),
    port: Number(assertEnv('DB_PORT')),
    username: assertEnv('DB_USERNAME'),
    password: assertEnv('DB_PASSWORD'),
    database: assertEnv('DB_DATABASE'),
  }),
}

@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DbModule {}
