import { NftEntity } from 'src/nft/entity/nft.entity'

export interface UserEntity {
  id: number
  name: string
  address: string
  signedPayload?: string
  cartSession?: string
  roles: string[]
}

export interface ProfileEntity {
  user: UserEntity
  nftCount: number
}

export interface UserCart {
  expiresAt: number | undefined
  nfts: NftEntity[]
}
