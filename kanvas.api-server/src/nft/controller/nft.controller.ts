import { Body, Controller, Get, Query, Post } from '@nestjs/common'
import { NftService } from '../service/nft.service'
import { NftEntity } from 'src/nft/entity/nft.entity'
import { FilterParams, AllNftsParams } from '../params'

@Controller('nfts')
export class NftController {
  constructor(private nftService: NftService) {}

  @Post()
  async create(@Body() nft: NftEntity): Promise<NftEntity> {
    return this.nftService.create(nft)
  }

  @Get('/filter')
  async filter(@Query() params: FilterParams) {
    console.log('parsed params: ', params)
    return this.nftService.filter(params)
  }

  @Get()
  async findAll(@Query() params: AllNftsParams): Promise<NftEntity[]> {
    return this.nftService.findAll(params)
  }
}
