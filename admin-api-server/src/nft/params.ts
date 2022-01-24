export class NftPaginationParams {
  page = 1;
  pageSize = 10;
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
