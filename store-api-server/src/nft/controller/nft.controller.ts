import {
  HttpException,
  HttpStatus,
  Res,
  Controller,
  Body,
  Get,
  Query,
  Param,
  Post,
  CACHE_MANAGER,
  Logger,
  Inject,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Response } from 'express';
import { cryptoUtils } from 'sotez';
import { NftService } from '../service/nft.service';
import { CategoryService } from 'src/category/service/category.service';
import { NftEntity, CreateNft } from '../entity/nft.entity';
import { FilterParams, PaginationParams, SearchParam } from '../params';
import { wrapCache } from 'src/utils';
import { ADMIN_PUBLIC_KEY } from 'src/constants';
import {
  BASE_CURRENCY,
  SIGNATURE_PREFIX_CREATE_NFT,
  SIGNATURE_PREFIX_DELIST_NFT,
  SIGNATURE_PREFIX_RELIST_NFT,
} from 'kanvas_lib';
import { validateRequestedCurrency } from 'src/paramUtils';

@Controller('nfts')
export class NftController {
  constructor(
    private nftService: NftService,
    private categoryService: CategoryService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  @Post('/create')
  async createNft(@Body() nft: CreateNft) {
    await this.#verifySignature(
      SIGNATURE_PREFIX_CREATE_NFT,
      nft.id,
      nft.signature,
    );

    return await this.nftService.createNft(nft);
  }

  @Post('/delist/:id')
  async delistNft(
    @Param('id') nftId: number,
    @Body('signature') signature: string,
  ) {
    await this.#verifySignature(SIGNATURE_PREFIX_DELIST_NFT, nftId, signature);

    this.nftService.delistNft(nftId);
  }

  @Post('/relist/:id')
  async relistNft(
    @Param('id') nftId: number,
    @Body('signature') signature: string,
  ) {
    await this.#verifySignature(SIGNATURE_PREFIX_RELIST_NFT, nftId, signature);

    this.nftService.relistNft(nftId);
  }

  @Get()
  async getFiltered(
    @Res() resp: Response,
    @Query() filters: FilterParams,
    @Query('currency') currency: string = BASE_CURRENCY,
  ) {
    validateRequestedCurrency(currency);
    this.#validateFilterParams(filters);

    return await wrapCache(
      this.cache,
      resp,
      'nft.findNftsWithFilter' + JSON.stringify(filters) + currency,
      () => {
        return this.nftService.findNftsWithFilter(filters, currency);
      },
    );
  }

  @Get('/search')
  async search(
    @Res() resp: Response,
    @Query() searchParams: SearchParam,
    @Query('currency') currency: string = BASE_CURRENCY,
  ) {
    validateRequestedCurrency(currency);

    return await wrapCache(
      this.cache,
      resp,
      'nft.search' + searchParams.searchString + currency,
      () => {
        return new Promise(async (resolve) => {
          resolve({
            nfts: await this.nftService.search(
              searchParams.searchString,
              currency,
            ),
            categories: await this.categoryService.search(
              searchParams.searchString,
            ),
          });
        });
      },
    );
  }

  @Post('/:id')
  async byId(
    @Param('id') id: number,
    @Query('currency') currency: string = BASE_CURRENCY,
  ): Promise<NftEntity> {
    validateRequestedCurrency(currency);

    id = Number(id);
    if (isNaN(id)) {
      throw new HttpException(
        `invalid id (should be a number)`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.nftService.byId(id, currency);
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

  async #verifySignature(hexPrefix: string, nftId: number, signature: string) {
    let nftIdHex = nftId.toString(16);
    if (nftIdHex.length & 1) {
      // hex is of uneven length, sotez expects an even number of hexadecimal characters
      nftIdHex = '0' + nftIdHex;
    }

    try {
      if (
        !(await cryptoUtils.verify(
          hexPrefix + nftIdHex,
          `${signature}`,
          ADMIN_PUBLIC_KEY,
        ))
      ) {
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }
    } catch (err: any) {
      Logger.warn(`Error on new nft signature validation, err: ${err}`);
      throw new HttpException(
        'Could not validate signature (it may be misshaped)',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
