import { Injectable } from '@nestjs/common'
import { NftEntity } from 'src/nft/entity/nft.entity'

@Injectable()
export class NftService {
  async create(_nft: NftEntity): Promise<NftEntity> {
    throw new Error(
      "Not yet implemented - let's implement it when we need it rather than have a big generated code blob",
    )
  }
  async edit(_nft: NftEntity): Promise<NftEntity> {
    throw new Error(
      "Not yet implemented - let's implement it when we need it rather than have a big generated code blob",
    )
  }
  async findAll(): Promise<NftEntity[]> {
    throw new Error(
      "Not yet implemented - let's implement it when we need it rather than have a big generated code blob",
    )
  }
}
