import {
  HttpException,
  HttpStatus,
  Res,
  Controller,
  Get,
  Query,
  Param,
  Post,
  CACHE_MANAGER,
  Inject,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Response } from 'express';
import { NftService } from '../service/nft.service';
import { CategoryService } from 'src/category/service/category.service';
import { NftEntity } from '../entity/nft.entity';
import { FilterParams, PaginationParams, SearchParam } from '../params';
import { wrapCache } from 'src/utils';

@Controller('nfts')
export class NftController {
  constructor(
    private nftService: NftService,
    private categoryService: CategoryService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  @Get()
  async getFiltered(@Res() resp: Response, @Query() params: FilterParams) {
    this.#validateFilterParams(params);
    return await wrapCache(
      this.cache,
      resp,
      'nft.findNftsWithFilter' + JSON.stringify(params),
      () => {
        return this.nftService.findNftsWithFilter(params);
      },
    );
  }

  @Get('/search')
  async search(@Res() resp: Response, @Query() params: SearchParam) {
    return await wrapCache(
      this.cache,
      resp,
      'nft.search' + params.searchString,
      () => {
        return new Promise(async (resolve) => {
          resolve({
            nfts: await this.nftService.search(params.searchString),
            categories: await this.categoryService.search(params.searchString),
          });
        });
      },
    );
  }

  @Post('/:id')
  async byId(@Param('id') id: number): Promise<NftEntity> {
    if (typeof id !== 'number') {
      throw new HttpException(
        `invalid id (should be a number)`,
        HttpStatus.BAD_REQUEST,
      );
    }
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
