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
import { NftEntity, NftEntityPage, SearchResult } from '../entity/nft.entity'
import { FilterParams, PaginationParams } from '../params'

@Controller('nfts')
export class NftController {
  constructor(private nftService: NftService) {}

  @Post()
  async create(@Body() nft: NftEntity): Promise<NftEntity> {
    return this.nftService.create(nft)
  }

  @Get('/filter')
  async filter(@Query() params: FilterParams): Promise<NftEntityPage> {
    this.validateFilterParams(params)
    return this.nftService.findNftsWithFilter(params)
  }

  @Get()
  async findAll(@Query() params: PaginationParams): Promise<NftEntityPage> {
    this.validatePaginationParams(params)
    return this.nftService.findAll(params)
  }

  @Get('/search/:searchString')
  async search(@Param('searchString') str: string): Promise<SearchResult> {
    return await this.nftService.search(str)
  }

  @Post('/:id')
  async byId(@Param('id') id: number): Promise<NftEntity> {
    return this.nftService.byId(id)
  }

  validateFilterParams(params: FilterParams): void {
    const filterCategories =
      typeof params.categories !== 'undefined' && params.categories.length > 0
    const filterAddress = typeof params.address === 'string'
    const filterPrice =
      typeof params.priceAtLeast === 'number' ||
      typeof params.priceAtMost === 'number'

    if (!filterCategories && !filterAddress && !filterPrice) {
      throw new HttpException('No filters specified', HttpStatus.BAD_REQUEST)
    }

    this.validatePaginationParams(params)
  }

  validatePaginationParams(params: PaginationParams): void {
    if (params.page < 1 || params.pageSize < 1) {
      throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST)
    }
    if (
      !['id', 'name', 'price', 'views'].some((elem) => elem === params.orderBy)
    ) {
      throw new HttpException(
        `Requested orderBy ('${params.orderBy}') not supported`,
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
