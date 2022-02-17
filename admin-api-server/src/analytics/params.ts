import { IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  parseStringArray,
  PaginationParams,
} from 'src/utils';

export class ActivityFilters {
  @IsArray()
  @Transform(({ value }) => parseStringArray(value))
  @IsOptional()
  kind?: string[];

  @IsArray()
  @Transform(({ value }) => parseStringArray(value))
  @IsOptional()
  from?: string[];

  @IsArray()
  @Transform(({ value }) => parseStringArray(value))
  @IsOptional()
  to?: string[];
}

export class ActivityFilterParams extends PaginationParams {
  filters: ActivityFilters = <ActivityFilters>{};
}
