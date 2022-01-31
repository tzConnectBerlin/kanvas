import { PaginationParams } from "src/utils";

export interface NftFilters {
  nftStates?: string[];
  nftIds?: number[];
}

export class NftFilterParams extends PaginationParams {
  filters: NftFilters = <NftFilters>{};
}

export function parseStringArray(v: string | string[], sep: string): string[] {
  if (typeof v !== 'string') {
    return v;
  }
  return v.split(sep);
}
