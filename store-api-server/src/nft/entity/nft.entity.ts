import { CategoryEntity } from 'src/category/entity/category.entity'

// TODO let's replace this and all other models with just a simple immutable key/value object - preferably using Immutable.js
export interface NftEntity {
  id: number
  name: string
  ipfsHash: string
  metadata: any // TODO expand on the meaning of this type
  dataUri: string
  contract: string
  tokenId: string
  categories: CategoryEntity[]
  editionsAvailable?: number
  status: string // corresponds to NftStateTransitionConfig
}

export interface NftEntityPage {
  firstRequestAt: number
  nfts: NftEntity[]
  currentPage: number
  numberOfPages: number
}
