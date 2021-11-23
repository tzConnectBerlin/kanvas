import { Module } from '@nestjs/common'
import { assertEnv } from 'src/utils'
import { PG_CONNECTION } from './constants'
import { Pool, types } from 'pg'

// Read postgres TIMESTAMP WITHOUT TIME ZONE values as UTC+0 Date
types.setTypeParser(
  1114 /* TIMESTAMP without time zone type */,
  function (stringValue: string) {
    return new Date(stringValue + '+0000')
  },
)
console.debug('PORT IS', Number(assertEnv('DB_PORT')))
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
