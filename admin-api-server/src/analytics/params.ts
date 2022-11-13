import { IsOptional, IsArray, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { parseStringArray, PaginationParams } from '../utils.js';

export class ActivityFilters {
  @IsArray()
  @Transform(({ value }) => parseStringArray(value))
  @IsOptional()
  kind?: string[];

  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;
}

export class ActivityFilterParams extends PaginationParams {
  filters: ActivityFilters = <ActivityFilters>{};
}
