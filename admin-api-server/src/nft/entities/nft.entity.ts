export interface NftEntity {
  id: number;
  createdBy: number;
  createdAt: number;
  updatedAt: number;

  state: string;
  attributes: any;
}
