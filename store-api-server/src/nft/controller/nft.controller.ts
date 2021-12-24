import {
  HttpException,
  HttpStatus,
  Body,
  Controller,
  Get,
  Query,
  Param,
  Post,
} from '@nestjs/common';
import { NftService } from '../service/nft.service';
import { NftEntity, NftEntityPage, SearchResult } from '../entity/nft.entity';
import { FilterParams, PaginationParams, SearchParam } from '../params';

@Controller('nfts')
export class NftController {
  constructor(private nftService: NftService) {}

  @Post()
  async create(@Body() nft: NftEntity): Promise<NftEntity> {
    return this.nftService.create(nft);
  }

  @Get()
  async getFiltered(@Query() params: FilterParams): Promise<NftEntityPage> {
    this.#validateFilterParams(params);
    return await this.nftService.findNftsWithFilter(params);
  }

  @Get('/search')
  async search(@Query() params: SearchParam): Promise<SearchResult> {
    return await this.nftService.search(params.searchString);
  }

  @Post('/:id')
  async byId(@Param('id') id: number): Promise<NftEntity> {
    return await this.nftService.byId(id);
  }

  #validateFilterParams(params: FilterParams): void {
    if (typeof params.availability !== 'undefined') {
      if (
        params.availability.some(
          (availabilityEntry: string) =>
            !['upcoming', 'onSale', 'soldOut'].some(
              (elem) => elem === availabilityEntry,
            ),
        )
      ) {
        throw new HttpException(
          `Requested availability ('${params.availability}') not supported`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    this.#validatePaginationParams(params);
  }

  #validatePaginationParams(params: PaginationParams): void {
    if (params.page < 1 || params.pageSize < 1) {
      throw new HttpException('Bad page parameters', HttpStatus.BAD_REQUEST);
    }
    if (!['asc', 'desc'].some((elem) => elem === params.orderDirection)) {
      throw new HttpException(
        `Requested orderDirection ('${params.orderDirection}') not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      !['id', 'name', 'price', 'views', 'createdAt'].some(
        (elem) => elem === params.orderBy,
      )
    ) {
      throw new HttpException(
        `Requested orderBy ('${params.orderBy}') not supported`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
