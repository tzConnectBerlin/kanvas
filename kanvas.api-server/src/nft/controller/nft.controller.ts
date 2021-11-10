import {
  HttpException,
  HttpStatus,
  Body,
  Controller,
  Get,
  Query,
  Param,
  Post,
} from '@nestjs/common'
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
  async filter(@Query() params: FilterParams): Promise<NftEntityPage> {
    const filterCategories = params.categories.length > 0
    const filterAddress = typeof params.address === 'string'
    if (!filterCategories && !filterAddress) {
      throw new HttpException(
        'Neither categories nor address filter specified, need at least 1 set',
        HttpStatus.BAD_REQUEST,
      )
    }

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
