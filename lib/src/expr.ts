import { Result, Ok, Err } from 'ts-results';
import * as log from 'log';
import { Nft } from './types';
import * as ext from './extensions';

export function evalExpr<T>(nftState: Nft, s: string, defaultOnErr: T): T {
  //const scopedEval = (scope: any, script: string) =>
  // Function(`"use strict"; ${script}`).bind(scope)();

  log.debug(`evaluation '${s}'`);
  try {
    const nft = nftState.attributes;

    //const res = eval(s);
    //const res = scopedEval({ nft: nftState.attributes, ext: ext }, s);
    const res = Function(
      `
"use strict";
return ((nft, ext) => ${s})(this.nft, this.ext)`,
    ).bind({ nft: nft, ext: ext })();

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
