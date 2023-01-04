import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { createRequire } from 'module';
import { SECURE_COOKIE_SETTINGS, JWT_SECRET } from '../constants.js';
const require = createRequire(import.meta.url);
const cookieSession = require('cookie-session');

@Injectable()
export class CookieSessionMiddleware implements NestMiddleware {
  private options: any = {
    secret: JWT_SECRET,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };

  constructor() {
    if (SECURE_COOKIE_SETTINGS) {
      this.options['sameSite'] = 'none';
      this.options['secure'] = true;
    }
  }

  use(req: any, resp: any, next: any): void {
    cookieSession(this.options)(req, resp, () => {
      if (typeof req.session.uuid === 'undefined') {
        req.session.uuid = uuidv4();
      }
      next();
    });
  }
}
