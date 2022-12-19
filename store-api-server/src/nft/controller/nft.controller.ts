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
   * @api {post} /nfts/create Create a new nft. In a normal Kanvas deployment this is only called from the Admin API.
   * @apiBody {CreateNft} nft The NFT data needed to create a nft
   * @apiBody {Number} nft[id] The identifier to assign to this NFT
   * @apiBody {String} nft[name] The name of the nft
   * @apiBody {String} nft[description] The description of the nft
   * @apiBody {String} nft[artifactUri] The artifact uri of the nft
   * @apiBody {String} [nft[displayUri]] The display uri of the nft
   * @apiBody {String} [nft[thumbnailUri]] The thumbnail uri of the nft
   * @apiBody {String} [nft[displayUri]] The display uri of the nft
   * @apiBody {Number} nft[price] The price of the nft, in the API's base currency's base unit (eg if the base currency is set to EUR, price is defined in eurocents)
   * @apiBody {Number[]} nft[categories] The categories of the nft, in number format referencing the category identifiers
   * @apiBody {Number} nft[editionsSize] The edition size of the nft
   * @apiBody {Number} [nft[onsaleFrom]] The date from when the NFT will be on sale, if left undefined it will go on sale immediately
   * @apiBody {Number} [nft[onsaleUntil]] The date till when the NFT will be on sale. If undefined it will be on sale until it sells out
   * @apiBody {Object} [nft[formats]] Specification of artifact,display,thumbnail content. Eg, mimeType can be specified here, or width and height, etc.
   * @apiBody {Any} nft[metadata] Any custom metadata of the nft, useful for deployment specific aspects or to enable special features for one off NFTs
   * @apiBody {String} nft[signature] The signed nft id, proving the caller has authorization to push new NFTs into the store. In a normal Kanvas deployment only the Admin API is able to provide correct signatures
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
   * @api {post} /nfts/create-proxied Create a proxied nft that can only be claimed via purchase of a Proxy nft.
   * @apiBody {CreateProxiedNft} nft The NFT data needed to create the proxied nft
   * @apiBody {Number} nft[id] The id used to create the nft
   * @apiBody {Number} nft[proxyNftId] The NFT is only to be delivered on purchase of the proxy NFT.
   * @apiBody {String} [nft[name]] The name of the nft
   * @apiBody {String} [nft[description]] The description of the nft
   * @apiBody {String} nft[artifactUri] The artifact uri of the nft
   * @apiBody {String} [nft[displayUri]] The display uri of the nft
   * @apiBody {String} [nft[thumbnailUri]] The thumbnail uri of the nft
   * @apiBody {String} [nft[displayUri]] The display uri of the nft
   * @apiBody {Number[]} nft[categories] The categories of the nft (see createNft docs for more info)
   * @apiBody {Any} [nft[metadata]] The metadata of the nft (see createNft docs for more info)
   * @apiBody {String} nft[signature] The signature of the nft (see createNft docs for more info)
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
   * @api {post} /nfts/delist/:id Delist an nft. This will exclude this NFT from the API's responses and allowed parameters, for example it will not be present in the store, and if someone has already purchased this NFT the they will no longer see it in their profile
   * @apiParam {Number} id The id of the nft
   * @apiBody {String} signature The signature of the nft (see createNft for more info)
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
   * @api {post} /nfts/relist/:id Relist an nft, this undos a previous nft delisting
   * @apiParam {Number} id The id of the nft
   * @apiBody {String} signature The signature of the nft (see createNft for more info)
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
   * @apiDescription Results are paginated.
   *
   * Optionally, a set of filters can be specified. NFTs can be filtered by: categories, userAddress, priceAtLeast, priceAtMost, availability (for more info see the Query parameters section below).
   *
   * For each filter, if not specified, it's not applied (so, for example, if no availability is specified, NFTs of all availability status' are returned).
   * If multiple filters are specified, NFTs that fit each criteria are returned (AND logic, not OR).
   *
   * Note: ipfsHash may be null in the response. It's only set (not null) for NFTs that have already been purchased at least once.
   * We do this to allow remaining uncommitted to the existence of an NFT for as long as possible.
   * This would be useful in case for some reason an NFT no longer is deemed appropriate and should be delisted.
   * Delisting is always possible, in the sense of blacklisting it from the store, however once the IPFS hash is shared and the NFT is minted on the blockchain, it is no longer possible to erase the NFT entirely.
   * @apiQuery {String} [currency] Defaults to the base currency if not provided
   * @apiQuery {Object="categories: number[]","userAddress: string","priceAtLeast: number","priceAtMost: number","availability: string[]","proxyFolding: 'fold' | 'unfold' | 'both'"} [filters]
   * @apiQuery {Number[]} filters[categories] Get NFTs that belong to any of a comma separated set of category identifiers (eg: 1,4,10). Multiple entries here means: find NFTs that belong to at least one of the given categories
   * @apiQuery {String} filters[userAddress] Get NFTs that are owned by some tezos address.
   * @apiQuery {Number} filters[priceAtLeast] Get NFTs that at least cost x amount (x is inclusive).
   * @apiQuery {Number} filters[priceAtMost] Get NFTs that at most cost x amount (x is inclusive).
   * @apiQuery {String[]} filters[availability] Comma separated enable-list of availability status (each entry being one of 'onSale','soldOut','upcoming'). Multiple entries means find NFTs that belong to one of the entries.
   * @apiQuery {Number} filters[proxyFolding] If set to 'fold' exclude proxied NFTs, if set to 'unfold' exclude proxy NFTs, if set to 'both' (default) include both
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
   * @api {get} /nfts/search Find NFTs based on a search string
   * @apiDescription This searches for:
   * - NFTs by name and description
   * - For categories by name
   * @apiQuery {String} [currency] Defaults to the base currency if not provided
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
   * @api {get} /nfts/:id Get NFT by id
   * @apiParam {Number} id The id of the NFT to retrieve
   * @apiQuery {String} [userAddress] userAddress of the user that owns the NFT on chain
   * @apiQuery {String} [currency] Defaults to the base currency if not provided
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
    @Res() resp: Response,
    @Query('userAddress') userOnchainOwnedInfo?: string,
    @Query('currency') currency: string = BASE_CURRENCY,
  ) {
    validateRequestedCurrency(currency);

    id = Number(id);
    if (isNaN(id)) {
      throw new HttpException(
        `invalid id (should be a number)`,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.nftService.incrementNftViewCount(id);
    return await wrapCache(this.cache, resp, `nft.byId${id}${currency}`, () => {
      return this.nftService.byId(id, currency, userOnchainOwnedInfo);
    });
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
