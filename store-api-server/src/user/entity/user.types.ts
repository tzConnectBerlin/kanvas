import type { NftEntity, NftEntityPage } from '../../nft/entity/nft.entity.js';

export interface WalletData {
  address: string;
  provider: string;

  ssoId?: string;
  ssoType?: string;
  ssoEmail?: string;
}

export interface UserEntity {
  id: number;
  userAddress: string;
  createdAt: number; // in UTC UNIX
  profilePicture: string;
  signedPayload?: string;
  cartSession?: string;
}

export interface UserEntityWithWalletData extends UserEntity {
  walletProvider?: string;
  ssoId?: string;
  ssoType?: string;
  ssoEmail?: string;
}

export interface ProfileEntity {
  user: UserEntity;
  collection: NftEntityPage;
  pendingOwnership: NftEntity[];
  keys: Record<string, number>;
}

export interface UserCart {
  expiresAt?: number;
  nfts: NftEntity[];
}

export interface UserTotalPaid {
  userId: number;
  userPicture?: string;
  totalPaid: string;
}

export interface NftOwnershipStatus {
  nftId: number;
  ownerStatuses: string[]; // List, because 1 user can have multiple editions of a single nft
}
