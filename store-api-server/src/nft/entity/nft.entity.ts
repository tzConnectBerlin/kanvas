import { CategoryEntity } from 'src/category/entity/category.entity'

// TODO let's replace this and all other models with just a simple immutable key/value object - preferably using Immutable.js
export interface NftEntity {
  id: number
  createdAt: number
  name: string
  description?: string
  ipfsHash: string
  metadata: any // TODO expand on the meaning of this type
  dataUri: string
  contract: string
  tokenId: string
  price: number
  categories: CategoryEntity[]
  editionsSize: number
  editionsAvailable: number
  launchAt: number
}

export interface NftEntityPage {
  firstRequestAt: number // in UTC UNIX
  nfts: NftEntity[]
  currentPage: number
  numberOfPages: number
  lowerPriceBound: number
  upperPriceBound: number
}

export interface SearchResult {
  nfts: NftEntity[]
  categories: number[]
}
