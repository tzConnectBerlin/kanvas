export interface FilterParams {
  [key: string]: string | string[];
}

export interface QueryParams {
  sort?: string[];
  filter?: FilterParams;
  range?: number[];
}
