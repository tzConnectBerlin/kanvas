import {
  HttpException,
  HttpStatus,
  Header,
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
import sotez from 'sotez';
const { cryptoUtils } = sotez;
import { NftService } from '../service/nft.service.js';
import { CategoryService } from '../../category/service/category.service.js';
import {
  NftEntity,
  CreateNft,
  CreateProxiedNft,
} from '../entity/nft.entity.js';
import {
  FilterParams,
  SearchParam,
  validatePaginationParams,
} from '../params.js';
import { wrapCache } from '../../utils.js';
import { ADMIN_PUBLIC_KEY } from '../../constants.js';
import {
  BASE_CURRENCY,
  SIGNATURE_PREFIX_CREATE_NFT,
  SIGNATURE_PREFIX_DELIST_NFT,
  SIGNATURE_PREFIX_RELIST_NFT,
} from 'kanvas-api-lib';
import { validateRequestedCurrency } from '../../paramUtils.js';

@Controller('nfts')
export class NftController {
  constructor(
    private nftService: NftService,
    private categoryService: CategoryService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  /**
   * @apiGroup nfts
   * @api {post} /nfts/create Create a nft
   * @apiBody {CreateNft} nft The nft data needed to create a nft
   * @apiBody {Number} nft[id] The id used to create the nft
   * @apiBody {Number} [nft[proxyNftId]] The proxy nft id
   * @apiBody {String} nft[name] The name of the nft
   * @apiBody {String} nft[description] The description of the nft
   * @apiBody {String} nft[artifactUri] The artifact uri of the nft
   * @apiBody {String} [nft[displayUri]] The display uri of the nft
   * @apiBody {String} [nft[thumbnailUri]] The thumbnail uri of the nft
   * @apiBody {String} [nft[displayUri]] The display uri of the nft
   * @apiBody {Number} nft[price] The price of the nft
   * @apiBody {Number[]} nft[categories] The categories of the nft
   * @apiBody {Number} nft[editionsSize] The edition size of the nft
   * @apiBody {Number} [nft[onsaleFrom]] The date from when the nft will be on sale
   * @apiBody {Number} [nft[onsaleUntil]] The date till when the nft will be on sale
   * @apiBody {Object} [nft[formats]] The formats of the nft
   * @apiBody {Any} nft[metadata] The metadata of the nft
   * @apiBody {String} nft[signature] The signature of the nft
   *
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "id": 10,
   *      "name": "test",
   *      "description": "test description',
   *      "artifactUri": "some_s3_uri",
   *      "price": '200,
   *      "isProxy": false,
   *      "categories": [10],
   *      "editionsSize": 4,
   *      "signature": "a valid signature",
   *    }
   *
   *
   * @apiName createNft
   */
  @Post('/create')
  async createNft(@Body() nft: CreateNft) {
    await this.#verifySignature(
      SIGNATURE_PREFIX_CREATE_NFT,
      nft.id,
      nft.signature,
    );

    return await this.nftService.createNft(nft);
  }

  /**
   * @apiGroup nfts
   * @api {post} /nfts/create-proxied Create a proxied nft
   * @apiBody {CreateProxiedNft} nft The nft data needed to create the proxied nft
   * @apiBody {Number} nft[id] The id used to create the nft
   * @apiBody {Number} nft[proxyNftId] The proxy nft id
   * @apiBody {String} [nft[name]] The name of the nft
   * @apiBody {String} [nft[description]] The description of the nft
   * @apiBody {String} nft[artifactUri] The artifact uri of the nft
   * @apiBody {String} [nft[displayUri]] The display uri of the nft
   * @apiBody {String} [nft[thumbnailUri]] The thumbnail uri of the nft
   * @apiBody {String} [nft[displayUri]] The display uri of the nft
   * @apiBody {Number[]} nft[categories] The categories of the nft
   * @apiBody {Any} [nft[metadata]] The metadata of the nft
   * @apiBody {String} nft[signature] The signature of the nft
   *
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "id": 10,
   *      "proxyNftId": 20,
   *      "name": "test",
   *      "description": "test description",
   *      "artifactUri": "some_s3_uri",
   *      "price": 200,
   *      "isProxy": false,
   *      "categories": [10],
   *      "editionsSize": 4,
   *      "signature": "a valid signature"
   *    }
   * @apiName createProxiedNft
   */
  @Post('/create-proxied')
  async createProxiedNft(@Body() nft: CreateProxiedNft) {
    await this.#verifySignature(
      SIGNATURE_PREFIX_CREATE_NFT,
      nft.id,
      nft.signature,
    );

    return await this.nftService.createProxiedNft(nft);
  }

  /**
   * @apiGroup nfts
   * @api {post} /nfts/delist/:id Delist a nft
   * @apiParam {Number} id The id of the nft
   * @apiBody {String} signature The signature of the nft
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "signature": "a valid signature"
   *    }
   * @apiExample {http} Example http request url (make sure to replace $base_url with the store-api-server endpoint):
   *  $base_url/nfts/delist/5
   * @apiName delistNft
   */
  @Post('/delist/:id')
  async delistNft(
    @Param('id') nftId: number,
    @Body('signature') signature: string,
  ) {
    nftId = Number(nftId);
    if (isNaN(nftId)) {
      throw new HttpException(`invalid nft id`, HttpStatus.BAD_REQUEST);
    }
    await this.#verifySignature(
      SIGNATURE_PREFIX_DELIST_NFT,
      Number(nftId),
      signature,
    );

    await this.nftService.delistNft(nftId);
  }

  /**
   * @apiGroup nfts
   * @api {post} /nfts/relist/:id Relist a nft
   * @apiParam {Number} id The id of the nft
   * @apiBody {String} signature The signature of the nft
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "signature": "a valid signature"
   *    }
   * @apiExample {http} Example http request url (make sure to replace $base_url with the store-api-server endpoint):
   *  $base_url/nfts/relist/5
   * @apiName relistNft
   */
  @Post('/relist/:id')
  async relistNft(
    @Param('id') nftId: number,
    @Body('signature') signature: string,
  ) {
    nftId = Number(nftId);
    if (isNaN(nftId)) {
      throw new HttpException(`invalid nft id`, HttpStatus.BAD_REQUEST);
    }
    await this.#verifySignature(SIGNATURE_PREFIX_RELIST_NFT, nftId, signature);

    await this.nftService.relistNft(nftId);
  }

  /**
   * @apiGroup nfts
   * @api {get} /nfts Get all nfts (optionally filtered by filterParam)
   * @apiQuery {String} [currency] Defaults to a base currency if not provided
   * @apiQuery {Object="categories: number[]","userAddress: string","priceAtLeast: number","priceAtMost: number","availability: string[]","proxyFolding: 'fold' | 'unfold' | 'both'"} [filters]
   * @apiSuccessExample Example Success-Response:
   *  {
   *     "currentPage": 1,
   *     "numberOfPages": 7,
   *     "totalNftCount": 67,
   *     "nfts": [
   *         {
   *             "id": 5,
   *             "name": "scotland",
   *             "description": "Thumbnail probably has nothing to do with Scotland. Maybe the guy is scottish. Who knows",
   *             "isProxy": false,
   *             "ipfsHash": "ipfs://QmVFPACwpMSMszsh26eBpBL33L5umUvkUCnYzJhqxzUS82",
   *             "metadataIpfs": "ipfs://QmVFPACwpMSMszsh26eBpBL33L5umUvkUCnYzJhqxzUS82",
   *             "artifactIpfs": null,
   *             "displayIpfs": null,
   *             "thumbnailIpfs": null,
   *             "artifactUri": "https://kanvas-admin-files.s3.amazonaws.com/NFT_FILE__5_image.png",
   *             "displayUri": "https://kanvas-admin-files.s3.amazonaws.com/NFT_FILE__5_image.png",
   *             "thumbnailUri": "https://kanvas-admin-files.s3.eu-central-1.amazonaws.com/NFT_FILE__5_thumbnail.png",
   *             "price": "0.30",
   *             "categories": [
   *                 {
   *                     "id": 10,
   *                     "name": "Landscape",
   *                     "description": "Sub photography category"
   *                 }
   *             ],
   *             "metadata": null,
   *             "editionsSize": 10,
   *             "editionsAvailable": 7,
   *             "editionsSold": 3,
   *             "createdAt": 1645709306,
   *             "launchAt": 1647342000,
   *             "onsaleFrom": 1647342000,
   *             "mintOperationHash": null
   *         },
   *         ...
   *      ],
   *      "lowerPriceBound": "0.04",
   *      "upperPriceBound": "9999.99"
   *  }
   * @apiExample {http} Example http request url (make sure to replace $base_url with the store-api-server endpoint):
   *  $base_url/nfts?currency=EUR
   * @apiName getFiltered
   */
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

  /**
   * @apiGroup nfts
   * @api {get} /nfts/search Get all nfts (filtered by searchParam)
   * @apiQuery {String} [currency] Defaults to a base currency if not provided
   * @apiQuery {Object="searchString: string"} searchParams string to filter all nfts
   * @apiSuccessExample Example Success-Response:
   * {
   *   "nfts": [...],
   *     "categories": [
   *         {
   *             "id": 13,
   *             "name": "Honk Kong",
   *             "description": "Sub cities category"
   *         }
   *     ]
   * }
   * @apiExample {http} Example http request url (make sure to replace $base_url with the store-api-server endpoint):
   *  $base_url/nfts/search?currency=EUR&searchString=honk%20kong%20festival
   * @apiName search
   */
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

  /**
   * @apiGroup nfts
   * @api {get} /nfts/:id Get nft by id
   * @apiParam {Number} id The id of the nft
   * @apiQuery {String} [userAddress] userAddress of the user that owns the nft on chain
   * @apiQuery {String} [currency] Defaults to a base currency if not provided
   * @apiSuccessExample Example Success-Response:
   * {
   *     "id": 5,
   *     "name": "scotland",
   *     "description": "Thumbnail probably has nothing to do with Scotland. Maybe the guy is scottish. Who knows",
   *     "isProxy": false,
   *     "ipfsHash": "ipfs://QmVFPACwpMSMszsh26eBpBL33L5umUvkUCnYzJhqxzUS82",
   *     "metadataIpfs": "ipfs://QmVFPACwpMSMszsh26eBpBL33L5umUvkUCnYzJhqxzUS82",
   *     "artifactIpfs": null,
   *     "displayIpfs": null,
   *     "thumbnailIpfs": null,
   *     "artifactUri": "https://kanvas-admin-files.s3.amazonaws.com/NFT_FILE__5_image.png",
   *     "displayUri": "https://kanvas-admin-files.s3.amazonaws.com/NFT_FILE__5_image.png",
   *     "thumbnailUri": "https://kanvas-admin-files.s3.eu-central-1.amazonaws.com/NFT_FILE__5_thumbnail.png",
   *     "price": "0.30",
   *     "categories": [
   *         {
   *             "id": 10,
   *             "name": "Landscape",
   *             "description": "Sub photography category"
   *         }
   *     ],
   *     "metadata": null,
   *     "editionsSize": 10,
   *     "editionsAvailable": 7,
   *     "editionsSold": 3,
   *     "createdAt": 1645709306,
   *     "launchAt": 1647342000,
   *     "onsaleFrom": 1647342000,
   *     "mintOperationHash": null
   * }
   * @apiExample {http} Example http request url (make sure to replace $base_url with the store-api-server endpoint):
   *  $base_url/nfts/5?currency=EUR
   * @apiName byId
   */
  @Get('/:id')
  @Header('cache-control', 'no-store,must-revalidate')
  async byId(
    @Param('id') id: number,
    @Query('userAddress') userOnchainOwnedInfo?: string,
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
    return await this.nftService.byId(id, currency, userOnchainOwnedInfo);
  }

  #validateFilterParams(params: FilterParams): void {
    if (typeof params.availability !== 'undefined') {
      if (
        params.availability.some(
          (availabilityEntry: string) =>
            !['upcoming', 'onSale', 'soldOut', 'endingSoon'].some(
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

    validatePaginationParams(params);
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
