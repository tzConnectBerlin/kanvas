import { Ok, Err } from 'ts-results';
import * as bcrypt from 'bcrypt';
import { AUTH_SALT_ROUNDS } from './constants';
import { FilterParams } from './types';
import { NftFilterParams } from './nft/params';

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

export const hashPassword = async (plaintext: string): Promise<string> => {
  return bcrypt.hash(plaintext, AUTH_SALT_ROUNDS);
};

export const convertToSnakeCase = (str: string) => {
  return (
    str &&
    str
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
      )
      .map((s) => s.toLowerCase())
      .join('_')
  );
};

export const prepareFilterClause = (
  filter: FilterParams = {},
): { query: string; params: unknown[] } => {
  let query = '';
  let indexes = 0;
  const keys = Object.keys(filter);
  if (keys.length) {
    query = keys.reduce((acc, curr, index) => {
      indexes++;
      acc += Array.isArray(filter[curr])
        ? `WHERE ${curr} = ANY ($${indexes}) `
        : `WHERE ${curr} = $${indexes} `;
      if (index !== keys.length - 1) {
        acc += 'AND ';
      }
      return acc;
    }, '');
  }
  return { query, params: Object.values(filter) };
};

export const prepareNftFilterClause = (
  filter: FilterParams = {},
): { query: string; params: unknown[] } => {
  let query = '';
  let indexes = 0;
  const keys = Object.keys(filter);
  if (keys.length) {
    query = keys.reduce((acc, curr, index) => {
      indexes++;
      acc += Array.isArray(filter[curr])
        ? `WHERE ${curr} = ANY ($${indexes}) `
        : `WHERE ${curr} = $${indexes} `;
      if (index !== keys.length - 1) {
        acc += 'AND ';
      }
      return acc;
    }, '');
  }
  return { query, params: Object.values(filter) };
};

export function enumFromStringValue<T>(
  enm: { [s: string]: T },
  value: string,
): T | undefined {
  return (Object.values(enm) as unknown as string[]).includes(value)
    ? (value as unknown as T)
    : undefined;
}
