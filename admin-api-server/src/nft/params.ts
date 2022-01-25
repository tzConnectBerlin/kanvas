export class NftPaginationParams {
  pageOffset = 0;
  pageSize = 10;

  orderBy = 'nft_id';
  orderDirection = 'asc';
}

export interface NftFilters {
  nftStates?: string[];
}

export class NftFilterParams extends NftPaginationParams {
  filters: NftFilters;
}

export function parseStringArray(v: string | string[], sep: string): string[] {
  if (typeof v !== 'string') {
    return v;
  }
  return v.split(sep);
}
