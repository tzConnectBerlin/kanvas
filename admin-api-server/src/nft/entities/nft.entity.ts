export interface NftAttribute {
  name: string;
  value?: string; // nullable
}

export interface NftEntity {
  id: number;
  createdBy: number;
  createdAt: number;
  updatedAt: number;

  state: string;
  attributes: NftAttribute[];
}
