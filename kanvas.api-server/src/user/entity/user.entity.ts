import { NftEntity } from 'src/nft/entity/nft.entity'

export interface UserEntity {
  id: number
  name: string
  address: string
  signedPayload?: string
  cartSession?: string
  roles: string[]
}

export interface UserCart {
  expires_at: number | undefined
  nfts: NftEntity[]
}
