import { Result, Ok, Err } from 'ts-results';

export function evalExpr<T>(nftState: Nft, s: string, defaultOnErr: T): T {
  console.log(`evaluation '${s}'`);
  try {
    const nft = nftState.attributes;
    const res = eval(s);
    if (typeof defaultOnErr === 'undefined') {
      return res;
    }

    if (typeof res !== typeof defaultOnErr) {
      throw `unexpected eval result type, result value is ${res}, input was ${s}`;
    }
    return res;
  } catch (err: any) {
    console.log(err);
    return defaultOnErr;
  }
}

export function execExpr(nftState: Nft, s: string): void {
  evalExpr<void>(nftState, s, undefined);
}
