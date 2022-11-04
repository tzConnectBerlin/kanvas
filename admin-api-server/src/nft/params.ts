import { IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  parseStringArray,
  parseNumberParam,
  PaginationParams,
} from '../utils/utils.js';

export class NftFilters {
  @IsArray()
  @Transform(({ value }) => parseStringArray(value))
  @IsOptional()
  nftStates?: string[];

  @IsArray()
  @Transform(({ value }) =>
    parseStringArray(value)?.map((v: string) => parseNumberParam(v)),
  )
  @IsOptional()
  nftIds?: number[];
}

export class NftFilterParams extends PaginationParams {
  filters?: NftFilters = <NftFilters>{};
}
