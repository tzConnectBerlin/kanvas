import ts_results from 'ts-results';
const { Ok, Err } = ts_results;
import { HttpException } from '@nestjs/common';
import { Response } from 'express';
import { Cache } from 'cache-manager';
import { Lock } from 'async-await-mutex-lock';
import {
  BEHIND_PROXY
} from './constants.js';

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
    throw new AssertionError(
      `Environment variable ${v} has to be set before starting this program`,
    );
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

//
// testing utils
//

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withKeyLocked<LockKeyTy, ResTy>(
  lock: Lock<LockKeyTy>,
  key: LockKeyTy,
  f: () => Promise<ResTy>,
): Promise<ResTy> {
  await lock.acquire(key);
  try {
    return await f();
  } finally {
    lock.release(key);
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

export function getRealIp(request: any): string {
  const { ip } = request;
  return BEHIND_PROXY ? request.get('X-Forwarded-For') || ip : ip;
}
