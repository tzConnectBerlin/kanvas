import { IsOptional, IsArray, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { parseStringArray, PaginationParams } from '../utils.js';

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

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}

export class ActivityFilterParams extends PaginationParams {
  filters: ActivityFilters = <ActivityFilters>{};
}
