export class NftPaginationParams {
  pageOffset = 0;
  pageSize = 10;

  orderBy = 'id';
  orderDirection = 'asc';
}

export interface NftFilters {
  nftStates?: string[];
  nftIds?: number[];
}

export class NftFilterParams extends NftPaginationParams {
  filters: NftFilters = <NftFilters>{};
}

export function parseStringArray(v: string | string[], sep: string): string[] {
  if (typeof v !== 'string') {
    return v;
  }
  return v.split(sep);
}
