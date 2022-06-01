import { HttpException, HttpStatus } from '@nestjs/common';
import {
  IsString,
  IsInt,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PaginationParams {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

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

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  firstRequestAt?: number;
}

export class FilterParams extends PaginationParams {
  @IsArray()
  @Transform(({ value }) =>
    value
      ? parseStringArray(value, ',').map((v: string) => parseNumberParam(v))
      : undefined,
  )
  @IsOptional()
  categories?: number[];

  @IsString()
  @IsOptional()
  userAddress?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  priceAtLeast?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  priceAtMost?: number;

  @IsArray()
  @Transform(({ value }) => (value ? parseStringArray(value, ',') : undefined))
  @IsOptional()
  availability?: string[];
}

export class SearchParam {
  @IsString()
  searchString: string;
}

function parseStringArray(v: string | string[], sep: string): string[] {
  if (typeof v !== 'string') {
    return v;
  }
  return v.split(sep);
}

function parseNumberParam(v: string): number {
  const res = Number(v);
  if (isNaN(res)) {
    throw new HttpException(`${v} is not a number`, HttpStatus.BAD_REQUEST);
  }
  return res;
}

export function validatePaginationParams(params: PaginationParams): void {
  if (params.page < 1 || params.pageSize < 1) {
    throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST);
  }
  if (!['asc', 'desc'].some((elem) => elem === params.orderDirection)) {
    throw new HttpException(
      `Requested orderDirection ('${params.orderDirection}') not supported`,
      HttpStatus.BAD_REQUEST,
    );
  }
  if (
    !['id', 'name', 'price', 'views', 'createdAt'].some(
      (elem) => elem === params.orderBy,
    )
  ) {
    throw new HttpException(
      `Requested orderBy ('${params.orderBy}') not supported`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
