import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AUTH_SALT_ROUNDS, BEHIND_PROXY } from './constants.js';

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

export class PaginationParams {
  pageOffset = 0;
  pageSize = 10;
  orderDirection = 'asc';
  orderBy = 'id';
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

export const hashPassword = async (plaintext: string): Promise<string> => {
  return bcrypt.hash(plaintext, AUTH_SALT_ROUNDS);
};

export function enumFromStringValue<T>(
  enm: { [s: string]: T },
  value: string,
): T | undefined {
  return (Object.values(enm) as unknown as string[]).includes(value)
    ? (value as unknown as T)
    : undefined;
}

export function validatePaginationParams(
  params: PaginationParams,
  allowedSortableKeys: string[],
) {
  if (params.pageOffset < 0 || params.pageSize < 1) {
    throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST);
  }

  if (
    !allowedSortableKeys.some(
      (allowedfilterAttr: string) => allowedfilterAttr === params.orderBy,
    )
  ) {
    throw new HttpException(
      `${params.orderBy} is not one of the allowed sort keys`,
      HttpStatus.BAD_REQUEST,
    );
  }
  if (
    !['asc', 'desc'].some(
      (allowedOrderDir: string) => params.orderDirection == allowedOrderDir,
    )
  ) {
    throw new HttpException(
      `${params.orderDirection} is not one of the allowed sort directions`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export const queryParamsToPaginationParams = (
  sort?: string[],
  range?: number[],
): PaginationParams => {
  const res = new PaginationParams();

  if (typeof sort !== 'undefined' && sort.length > 0) {
    res.orderBy = sort[0];
    if (sort.length > 1) {
      res.orderDirection = sort[1] as 'asc' | 'desc';
    }
  }

  if (typeof range !== 'undefined' && range.length === 2) {
    res.pageOffset = range[0];
    res.pageSize = range[1];
  }

  return res;
};

export function parseStringArray(
  v: string | string[] | undefined,
  sep = ',',
): string[] | undefined {
  if (typeof v !== 'string') {
    return v;
  }
  return v.split(sep);
}

export function parseNumberParam(v: string): number {
  const res = Number(v);
  if (isNaN(res)) {
    throw new HttpException(`${v} is not a number`, HttpStatus.BAD_REQUEST);
  }
  return res;
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getClientIp(request: any): string {
  const { ip } = request;
  return BEHIND_PROXY
    ? request.get('X-Forwarded-For')?.split(',')[0] || ip
    : ip;
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
