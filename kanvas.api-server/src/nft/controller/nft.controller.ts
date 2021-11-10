import { Body, Controller, Get, Query, Param, Post } from '@nestjs/common'
import { NftService } from '../service/nft.service'
import { NftEntity, NftEntityPage } from 'src/nft/entity/nft.entity'
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
    return this.nftService.filter(params)
  }

  @Get()
  async findAll(@Query() params: AllNftsParams): Promise<NftEntityPage> {
    return this.nftService.findAll(params)
  }

  @Get('/:id')
  async byId(@Param('id') id): Promise<NftEntity> {
    return this.nftService.byId(id)
  }
}
