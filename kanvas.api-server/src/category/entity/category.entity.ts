import { NftEntity } from 'src/nft/entity/nft.entity'

export class CategoryEntity {
  id: number
  name: string
  description: string
  parent: CategoryEntity
  nfts: NftEntity[]
}
