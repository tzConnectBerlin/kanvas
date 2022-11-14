import { IsString, IsBoolean } from 'class-validator';
import type { NftEntity, NftEntityPage } from '../../nft/entity/nft.entity.js';

export interface UserEntity {
  id: number;
  userAddress: string;
  createdAt: number; // in UTC UNIX
  profilePicture: string;
  signedPayload?: string;
  cartSession?: string;
}

export interface ProfileEntity {
  user: UserEntity;
  collection: NftEntityPage;
  pendingOwnership: NftEntity[];
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

export class EmailRegistration {
  @IsString()
  walletAddress: string;
  @IsString()
  email: string;
  @IsBoolean()
  marketingConsent: boolean;
}
