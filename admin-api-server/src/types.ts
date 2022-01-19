export interface FilterParams {
  [key: string]: unknown | unknown[];
}


export interface QueryParams {
  sort?: string[];
  filter?: FilterParams;
  range?: number[];
}
