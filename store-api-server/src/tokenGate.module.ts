import { Request, Response, NextFunction } from 'express';
import { Inject, Module, NestMiddleware } from '@nestjs/common';
import { TokenGate } from 'token-gate';
import { PG_CONNECTION, TOKEN_GATE } from './constants.js';
import { DbPool, DbModule } from './db.module.js';

const tokenGateProvider = {
  provide: TOKEN_GATE,
  inject: [PG_CONNECTION],
  useFactory: (dbPool: DbPool) =>
    new TokenGate({
      dbSchema: 'token',
      dbPool,
    }).requireToken('/constants', 1),
};

@Module({
  imports: [DbModule],
  providers: [tokenGateProvider],
  exports: [tokenGateProvider],
})
export class TokenGateModule implements NestMiddleware {
  constructor(@Inject(TOKEN_GATE) private gate: any) {}

  use(req: Request, resp: Response, next: NextFunction): void {
    this.gate.middleware()(req, resp, next);
  }
}
