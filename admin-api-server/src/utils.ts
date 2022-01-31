import { Ok, Err } from 'ts-results';
import * as bcrypt from 'bcrypt';
import { AUTH_SALT_ROUNDS } from './constants';
import { FilterParams } from './types';
import { HttpException, HttpStatus } from '@nestjs/common';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class PaginationParams {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  pageOffset: number = 0;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  pageSize: number = 10;

  @IsString()
  @IsOptional()
  orderDirection: string = 'asc';

  @IsString()
  @IsOptional()
  orderBy: string = 'id';
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

export function validatePaginationParams(params: PaginationParams, allowedSortableKeys: string[]) {
  if (params.pageOffset < 0 || params.pageSize < 1) {
    throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST);
  }

  if (!(allowedSortableKeys.some(
    (allowedfilterAttr: string) => allowedfilterAttr !== params.orderBy
  ))) {
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
  range?: number[]
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
    res.pageSize = range[1] - range[0];
  }

  return res
}

export function parseStringArray(v: string | string[], sep = ','): string[] | undefined {
  if (typeof v !== 'string') {
    return undefined;
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


validatePaginationParams