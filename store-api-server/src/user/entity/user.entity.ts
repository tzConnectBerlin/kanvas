import { NftEntity } from '../../nft/entity/nft.entity';

export interface UserEntity {
  id: number;
  userName: string;
  userAddress: string;
  createdAt: number; // in UTC UNIX
  profilePicture: string;
  signedPayload?: string;
  cartSession?: string;
}

export interface ProfileEntity {
  user: UserEntity;
  nftCount: number;
}

export interface UserCart {
  expiresAt?: number;
  nfts: NftEntity[];
}

export interface UserTotalPaid {
  userId: number;
  userName: string;
  userPicture?: string;
  totalPaid: string;
}

export interface NftOwnershipStatus {
  nftId: number;
  ownerStatuses: string[]; // List, because 1 user can have multiple editions of a single nft
}
