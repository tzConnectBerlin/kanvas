import { Request, Response, NextFunction } from 'express';
import { Logger, Inject, Module, NestMiddleware } from '@nestjs/common';
import { TokenGate } from 'token-gate';
import {
  PG_CONNECTION,
  TOKEN_GATE,
  TOKEN_GATE_SPEC_FILE,
} from './constants.js';
import { assertEnv } from './utils.js';
import { DbPool, DbModule } from './db.module.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

interface Wrap {
  gate?: TokenGate;
}

const wrapGate = {
  provide: 'TOKEN_GATE_WRAP',
  useValue: <Wrap>{ gate: undefined },
};

const tokenGateProvider = {
  provide: TOKEN_GATE,
  inject: ['TOKEN_GATE_WRAP', PG_CONNECTION],
  useFactory: (w: Wrap, dbPool: DbPool) => {
    if (typeof w.gate !== 'undefined') {
      return w.gate;
    }
    w.gate = new TokenGate({
      dbPool,
    });
    if (typeof TOKEN_GATE_SPEC_FILE === 'undefined') {
      return w.gate;
    }
    const jwtSecret = assertEnv('JWT_SECRET');
    w.gate
      .loadSpecFromFile(TOKEN_GATE_SPEC_FILE)
      .setTzAddrFromReqFunc((req: any): string | undefined => {
        try {
          const token = req.get('authorization')?.replace(/^Bearer\ /, '');
          if (typeof token !== 'undefined') {
            return jwt.verify(token, jwtSecret).userAddress;
          }
        } catch (err: any) {
          Logger.warn(`failed to verify JWT: ${err}`);
        }
        return undefined;
      });

    Logger.log(
      `token gate spec: ${JSON.stringify(w.gate.getSpec(), undefined, 2)}`,
    );
    return w.gate;
  },
};

@Module({
  imports: [DbModule],
  providers: [wrapGate, tokenGateProvider],
  exports: [tokenGateProvider],
})
export class TokenGateModule implements NestMiddleware {
  constructor(@Inject(TOKEN_GATE) private gate: any) {}

  use(req: Request, resp: Response, next: NextFunction): void {
    this.gate.use(req, resp, next);
  }
}
