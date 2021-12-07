import { Result, Ok, Err } from 'ts-results';

export function evalExpr(nftState: Nft, s: string): Result<boolean, string> {
  try {
    const nft = nftState.attributes;
    const res = eval(s);
    if (typeof res !== 'boolean') {
      return Err(
        `unexpected eval result type, result value is ${res}, input was ${s}`,
      );
    }
    return Ok(res);
  } catch (err: any) {
    // console.log(err);
    return Ok(false);
  }
}
