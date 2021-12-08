import { Result, Ok, Err } from 'ts-results';
import * as log from 'log';
import { Nft } from './types';

export function evalExpr<T>(nftState: Nft, s: string, defaultOnErr: T): T {
  log.debug(`evaluation '${s}'`);
  try {
    const nft = nftState.attributes;
    const res = eval(s);
    if (typeof defaultOnErr === 'undefined') {
      // T is void, just accept any return value/type here, useful for execExpr.
      return res;
    }

    if (typeof res !== typeof defaultOnErr) {
      throw `unexpected eval result type, result value is ${res}, input was ${s}`;
    }
    return res;
  } catch (err: any) {
    log.info(err);
    return defaultOnErr;
  }
}

export function execExpr(nftState: Nft, s: string): void {
  evalExpr<void>(nftState, s, undefined);
}
