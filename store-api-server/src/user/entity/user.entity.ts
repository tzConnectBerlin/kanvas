import { NftEntity } from 'src/nft/entity/nft.entity';

export interface UserEntity {
  id: number;
  userName: string;
  userAddress: string;
  createdAt: number; // in UTC UNIX
  profilePicture: string;
  signedPayload?: string;
  cartSession?: string;
  roles: string[];
}

export interface ProfileEntity {
  user: UserEntity;
  nftCount: number;
}

export interface UserCart {
  expiresAt?: number;
  nfts: NftEntity[];
  locked: boolean;
}
