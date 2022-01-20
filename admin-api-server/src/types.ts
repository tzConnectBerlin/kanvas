import { NftFilterParams } from "./nft/params";

export interface FilterParams {
  [key: string]: unknown | unknown[];
}

export interface NftQueryParams {
  sort?: string[];
  filter?: NftFilterParams;
  range?: number[];
}

export interface QueryParams {
  sort?: string[];
  filter?: FilterParams;
  range?: number[];
}
