import { IsString, IsInt, IsOptional, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class NftPaginationParams {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  pageSize: number = 10;

  @IsArray()
  @Transform(({ value }) => (value ? parseStringArray(value, ',') : undefined))
  @IsOptional()
  nftStates?: string[];
}

function parseStringArray(v: string | string[], sep: string): string[] {
  if (typeof v !== 'string') {
    return v;
  }
  return v.split(sep);
}
