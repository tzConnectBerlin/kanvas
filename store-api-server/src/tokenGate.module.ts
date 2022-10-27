import { Request, Response, NextFunction } from 'express';
import { Logger, Inject, Module, NestMiddleware } from '@nestjs/common';
import { TokenGate } from 'token-gate';
import {
  PG_CONNECTION,
  TOKEN_GATE,
  TOKEN_GATE_SPEC_FILE,
} from './constants.js';
import { DbPool, DbModule } from './db.module.js';

const tokenGateProvider = {
  provide: TOKEN_GATE,
  inject: [PG_CONNECTION],
  useFactory: (dbPool: DbPool) => {
    const gate = new TokenGate({
      dbPool,
    });
    if (typeof TOKEN_GATE_SPEC_FILE !== 'undefined') {
      gate.loadSpecFromFile(TOKEN_GATE_SPEC_FILE);
    }
    return gate;
  },
};

@Module({
  imports: [DbModule],
  providers: [tokenGateProvider],
  exports: [tokenGateProvider],
})
export class TokenGateModule implements NestMiddleware {
  constructor(@Inject(TOKEN_GATE) private gate: any) {
    Logger.log(
      `token gate spec: ${JSON.stringify(this.gate.getSpec(), undefined, 2)}`,
    );
  }

  use(req: Request, resp: Response, next: NextFunction): void {
    this.gate.use(req, resp, next);
  }
}
