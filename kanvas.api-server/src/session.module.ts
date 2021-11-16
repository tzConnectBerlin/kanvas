/*
import cookieSession = require('cookie-session')
import { Module } from '@nestjs/common'
import { assertEnv } from './utils'
import { COOKIE_SESSION } from './constants'

const sessionProvider = {
  provide: COOKIE_SESSION,
  useValue: cookieSession({ secret: 'todo' }),
}

@Module({
  providers: [sessionProvider],
  exports: [sessionProvider],
})
export class SessionModule {}
*/
