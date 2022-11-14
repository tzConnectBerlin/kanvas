import ts_results from 'ts-results';
const { Ok, Err } = ts_results;
import { Response } from 'express';
import { Cache } from 'cache-manager';
import { BEHIND_PROXY } from './constants.js';

export async function wrapCache<T>(
  cache: Cache,
  resp: Response,
  key: string,
  newValue: () => Promise<T>,
): Promise<Response> {
  let fromCache = true;
  const res = await cache.wrap(key, () => {
    fromCache = false;
    return newValue();
  });

  return resp.set({ cached: fromCache ? 'yes' : 'no' }).json(res);
}

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export function assertEnv(v: string): string {
  const res = process.env[v];
  if (typeof res === 'string') {
    return res;
  } else {
    throw `Environment variable ${v} has to be set before starting this program`;
  }
}

// Like Array.prototype.filter. Invariant: only 1 result
export function findOne(predicate: any, xs: any[]) {
  const result = xs.filter(predicate);
  if (result.length === 0) {
    return new Err(`findOne found no results`);
  } else if (result.length === 1) {
    return new Ok(result[0]);
  } else {
    return new Err('findOne found multiple results');
  }
}

export function nowUtcWithOffset(offsetMs: number): string {
  const d = new Date();

  d.setTime(d.getTime() + offsetMs);
  return d.toISOString();
}

export function isBottom(v: any): boolean {
  // note: v here is checked for Javascripts' bottom values (null and undefined)
  //       because undefined coerces into null. It's safe because nothing
  //       else coerces into null (other than null itself).
  return v == null;
}

export function maybe<ValTy, ResTy>(
  x: ValTy | null | undefined,
  f: (x: ValTy) => ResTy,
): ResTy | undefined {
  if (isBottom(x)) {
    return undefined;
  }
  return f(x!);
}

export function getClientIp(request: any): string {
  const { ip } = request;
  return BEHIND_PROXY ? request.get('X-Forwarded-For') || ip : ip;
}

export function stringEnumValueIndex<T>(
  o: { [s: string]: T },
  v: T,
): number | undefined {
  const res = Object.values(o).indexOf(v);
  if (res < 0) {
    return undefined;
  }
  return res;
}

export function stringEnumIndexValue<T>(
  o: { [s: string]: T },
  i: number,
): T | undefined {
  const enumValues = Object.values(o);
  if (i < 0 || i >= enumValues.length) {
    return undefined;
  }
  return enumValues[i];
}

// testing util
export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
