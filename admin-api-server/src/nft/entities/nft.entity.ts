export interface NftEntity {
  id: number;
  createdBy: number;
  createdAt: number;
  updatedAt: number;

  state: string;
  attributes: any;
}

export interface NftUpdate {
  attribute: string;
  value?: string;
  file?: any;
}

export interface UrlParams {
  id: number;
}
