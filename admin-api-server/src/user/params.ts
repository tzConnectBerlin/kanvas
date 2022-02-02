import { IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  parseStringArray,
  parseNumberParam,
  PaginationParams,
} from 'src/utils';

export class UserFilters {
  @IsArray()
  @Transform(({ value }) =>
    parseStringArray(value)?.map((v: string) => parseNumberParam(v)),
  )
  @IsOptional()
  id?: number[];

  @IsArray()
  @Transform(({ value }) => parseStringArray(value))
  @IsOptional()
  userName?: string[];

  @IsArray()
  @Transform(({ value }) => parseStringArray(value))
  @IsOptional()
  address?: string[];

  @IsArray()
  @Transform(({ value }) =>
    parseStringArray(value)?.map((v: string) => parseNumberParam(v)),
  )
  @IsOptional()
  roleIds?: number[];
}

export class UserFilterParams extends PaginationParams {
  filters: UserFilters = <UserFilters>{};
}
