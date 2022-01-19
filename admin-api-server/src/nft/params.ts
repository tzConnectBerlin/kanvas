import { IsInt, IsOptional, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class NftPaginationParams {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page = 1;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  pageSize = 10;
}

export class NftFilterParams extends NftPaginationParams {
  @IsArray()
  @Transform(({ value }) => (value ? parseStringArray(value, ',') : undefined))
  @IsOptional()
  nftStates: string[];
}

function parseStringArray(v: string | string[], sep: string): string[] {
  if (typeof v !== 'string') {
    return v;
  }
  return v.split(sep);
}
