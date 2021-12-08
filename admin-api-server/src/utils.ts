import { Ok, Err } from 'ts-results';
import * as bcrypt from 'bcrypt';
import { AUTH_SALT_ROUNDS } from './constants';

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
