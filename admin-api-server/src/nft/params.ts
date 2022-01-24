import { QueryParams, FilterParams } from 'src/types';

export class NftPaginationParams {
  pageOffset = 0;
  pageSize = 10;

  orderBy = 'nft_id';
  orderDirection = 'asc';
}

export class NftFilterParams extends NftPaginationParams {
  nftStates?: string[];
}

export function parseStringArray(v: string | string[], sep: string): string[] {
  if (typeof v !== 'string') {
    return v;
  }
  return v.split(sep);
}
