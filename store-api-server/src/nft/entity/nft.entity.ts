import type { CategoryEntity } from '../../category/entity/category.entity.js';

export interface NftEntity {
  id: number;
  createdAt: number;
  name: string;
  description: string;

  ipfsHash?: string; // deprecated by metadataIpfs field
  metadataIpfs?: string;
  artifactIpfs?: string;
  displayIpfs?: string;
  thumbnailIpfs?: string;

  artifactUri: string;
  displayUri?: string;
  thumbnailUri?: string;

  price: string;
  categories: CategoryEntity[];
  editionsSize: number;
  editionsAvailable: number;
  launchAt: number;
  ownerStatuses?: string[];
  metadata?: any;
}

export interface CreateNft {
  id: number;
  name: string;
  description: string;

  artifactUri: string;
  displayUri?: string;
  thumbnailUri?: string;

  price: number;
  categories: number[];
  editionsSize: number;

  onsaleFrom?: number;
  onsaleUntil?: number;

  signature: string;
}

export interface NftEntityPage {
  firstRequestAt: number; // in UTC UNIX
  nfts: NftEntity[];
  currentPage: number;
  numberOfPages: number;
  totalNftCount: number;
  lowerPriceBound: string;
  upperPriceBound: string;
}

export interface SearchResult {
  nfts: NftEntity[];
  categories: CategoryEntity[];
}
