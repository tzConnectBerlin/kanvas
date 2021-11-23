import { Injectable, NestMiddleware } from '@nestjs/common'
import cookieSession = require('cookie-session')
import { v4 as uuidv4 } from 'uuid'
import { assertEnv } from '../utils'

@Injectable()
export class CookieSessionMiddleware implements NestMiddleware {
  private readonly options = {
    secret: assertEnv('JWT_SECRET'),
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }

  use(req: any, resp: any, next: any): void {
    cookieSession(this.options)(req, resp, () => {
      if (typeof req.session.uuid === 'undefined') {
        req.session.uuid = uuidv4()
      }
      next()
    })
  }
}
