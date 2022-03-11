import { Ok, Err } from 'ts-results';
import { HttpException } from '@nestjs/common';
import { Response } from 'express';
import { Cache } from 'cache-manager';

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

export async function expectErrWithHttpStatus(
  expStatusCode: number,
  f: () => Promise<any>,
): Promise<void> {
  try {
    await f();
  } catch (err: any) {
    //Logger.error(err);
    expect(err instanceof HttpException).toBe(true);

    const gotStatusCode = err.getStatus();
    expect(gotStatusCode).toEqual(expStatusCode);
    return;
  }
  expect('expected HttpException').toBe('got no error');
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
