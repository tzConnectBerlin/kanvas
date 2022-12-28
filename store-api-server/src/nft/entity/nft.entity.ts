import type { CategoryEntity } from '../../category/entity/category.entity.js';

export interface OwnershipInfo {
  status: 'owned' | 'pending' | 'payment processing';
  receivalOperationHash?: string;
}

export interface NftFormats {
  [key: string]: { [key: string]: any };
}

export interface NftEntity {
  id: number;
  createdAt: number;
  name: string;
  description: string;
  price: string;
  categories: CategoryEntity[];
  launchAt?: number; // deprecated by onsaleFrom
  metadata?: any;

  editionsSize: number;
  editionsAvailable: number;
  editionsSold: number;

  ipfsHash?: string; // deprecated by metadataIpfs field
  metadataIpfs?: string;
  artifactIpfs?: string;
  displayIpfs?: string;
  thumbnailIpfs?: string;

  formats?: NftFormats;

  artifactUri: string;
  displayUri?: string;
  thumbnailUri?: string;

  mintOperationHash?: string;
  ownerStatuses?: string[]; // deprecated by ownershipInfo
  ownershipInfo?: OwnershipInfo[];

  onsaleFrom?: number;
  onsaleUntil?: number;

  isProxy: boolean;
  proxyNftId?: number;
}

export interface CreateNft {
  id: number;
  proxyNftId?: number;

  name: string;
  description: string;

  artifactUri: string;
  displayUri?: string;
  thumbnailUri?: string;

  artifactIpfsUri: string;
  displayIpfsUri?: string;
  thumbnailIpfsUri?: string;

  price: number;
  categories: number[];
  editionsSize: number;

  onsaleFrom?: number;
  onsaleUntil?: number;

  formats?: NftFormats;
  metadata?: any;

  signature: string;
}

export interface CreateProxiedNft {
  id: number;
  proxyNftId: number;

  name?: string; // if null/undefined: copied from the proxy nft
  description?: string; // if null/undefined: copied from the proxy nft

  artifactUri: string;
  displayUri?: string;
  thumbnailUri?: string;

  artifactIpfsUri: string;
  displayIpfsUri?: string;
  thumbnailIpfsUri?: string;

  categories: number[];

  metadata?: any;

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
