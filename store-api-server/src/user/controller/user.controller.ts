import {
  Session,
  HttpException,
  Inject,
  Header,
  HttpStatus,
  Body,
  Param,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  Get,
  Res,
  UseGuards,
  Logger,
  CACHE_MANAGER,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Response } from 'express';
import { wrapCache } from '../../utils.js';
import { FileInterceptor } from '@nestjs/platform-express';
import validator from 'validator';
import { UserEntity, EmailRegistration } from '../entity/user.entity.js';
import { OwnershipInfo } from '../../nft/entity/nft.entity.js';
import { UserService } from '../service/user.service.js';
import { CurrentUser } from '../../decoraters/user.decorator.js';
import { validateRequestedCurrency } from '../../paramUtils.js';
import {
  JwtAuthGuard,
  JwtFailableAuthGuard,
} from '../../authentication/guards/jwt-auth.guard.js';
import {
  PG_UNIQUE_VIOLATION_ERRCODE,
  PG_FOREIGN_KEY_VIOLATION_ERRCODE,
  PROFILE_PICTURE_MAX_BYTES,
  PROFILE_PICTURES_ENABLED,
} from '../../constants.js';
import {
  PaginationParams,
  validatePaginationParams,
} from '../../nft/params.js';
import { BASE_CURRENCY } from 'kanvas-api-lib';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  /**
   * @apiGroup Users
   * @api {get} /users/profile Get a users profile
   * @apiQuery {String} [currency] The currency to show NFT prices in, uses the base currency if not provided
   * @apiQuery {String} [userAddress] The userAddress of the profile. Defaults to the logged in user's userAddress if not provided
   * @apiQuery {Object="page: number","pageSize: number","orderDirection: 'asc' | 'desc'","orderBy: string","firstRequestAt: number"} [paginationParams]
   * @apiPermission logged-in user
   * @apiSuccessExample Example Success-Response:
   * {
   *     "nftCount": 2,
   *     "user": {
   *         "createdAt": 1638452668,
   *         "id": 2,
   *         "profilePicture": "some url (e.g. S3 hosted)",
   *         "userAddress": "tz1",
   *         "userName": "test user"
   *     }
   * }
   * @apiName getProfile
   */
  @Get('/profile')
  @UseGuards(JwtFailableAuthGuard)
  async getProfile(
    @Query() paginationParams: PaginationParams,
    @CurrentUser() user?: UserEntity,
    @Query('userAddress') userAddress?: string,
    @Query('currency') currency: string = BASE_CURRENCY,
  ) {
    validatePaginationParams(paginationParams);
    validateRequestedCurrency(currency);
    const address =
      userAddress ||
      (typeof user !== 'undefined' ? user.userAddress : undefined);
    if (typeof address === 'undefined') {
      throw new HttpException(
        'Define userAddress parameter or access this endpoint logged in',
        HttpStatus.BAD_REQUEST,
      );
    }

    const profileRes = await this.userService.getProfile(
      address,
      paginationParams,
      currency,
      user?.id,
    );
    if (!profileRes.ok) {
      if (typeof userAddress === 'undefined') {
        throw new HttpException(
          'Failed to find user associated to JWT',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'No user registered with requested userAddress',
        HttpStatus.BAD_REQUEST,
      );
    }
    return profileRes.val;
  }

  /**
   * @apiGroup Users
   * @api {post} /users/profile/edit Edit a users profile, only allowed if the API is running with environment variable PROFILE_PICTURES_ENABLED set to 'yes'.
   * @apiBody {Any[]} profilePicture Attached profile picture
   * @apiPermission logged-in user
   * @apiExample {http} Http Request:
   *  POST /users/profile/edit (form, content-type: multipart/form-data
   * @apiName editProfile
   */
  @Post('/profile/edit')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: { fileSize: PROFILE_PICTURE_MAX_BYTES },
    }),
  )
  async editProfile(
    @CurrentUser() currentUser: UserEntity,
    @UploadedFile() picture?: any,
  ) {
    if (!PROFILE_PICTURES_ENABLED) {
      throw new HttpException(
        'editing profile pictures is not enabled',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }

    if (typeof picture === 'undefined') {
      throw new HttpException(
        'no profile picture attached',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.userService.edit(currentUser.id, picture);
    } catch (err: any) {
      Logger.warn(err);
      throw new HttpException(
        'Failed to edit profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @apiGroup Users
   * @api {post} /users/register/email Register an email for marketing purposes.
   * @apiBody {string} walletAddress The user's wallet address
   * @apiBody {string} email The user's email address
   * @apiBody {string} marketingConsent Whether the user expressed consent to receive marketing related messages
   * @apiBody {string} walletProvider The kind of wallet the user is using (eg: Temple, Kukai, etc.)
   * @apiBody {string} ssoId Optional, unique identifier associated to a social login
   * @apiBody {string} ssoType Optional, provider associated to a social login (eg: Google, Facebook, etc)
   * @apiBody {string} ssoEmail Optional, email address associated to a social login
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "walletAddress": "valid wallet address",
   *      "email": "max@muster.com",
   *      "marketingConsent": false,
   *      "walletProvider": "Temple"
   *    }
   * @apiName registerEmail
   */
  @Post('register/email')
  async registerEmail(@Body() registration: EmailRegistration): Promise<any> {
    if (
      !validator.isEmail(registration.email, {
        allow_ip_domain: true,
      })
    ) {
      throw new HttpException('invalid email', HttpStatus.BAD_REQUEST);
    }

    if (
      typeof registration.ssoEmail !== 'undefined' &&
      !validator.isEmail(registration.ssoEmail, {
        allow_ip_domain: true,
      })
    ) {
      throw new HttpException('invalid ssoEmail', HttpStatus.BAD_REQUEST);
    }

    return await this.userService.registerEmail(registration);
  }

  /**
   * @apiGroup Users
   * @api {get} /users/topBuyers Get the top buyers
   * @apiQuery {String} [currency] Defaults to the base currency if not provided
   * @apiSuccessExample Example Success-Response:
   * {
   *     "topBuyers": [
   *         {
   *             "totalPaid": "3019.91",
   *             "userAddress": "tz1g3coajkc9N77XDy55pVEgBGWspQfYqMiH",
   *             "userId": 1,
   *             "userName": "Setter_agitated_17",
   *             "userPicture": null
   *         },
   *         {
   *             "totalPaid": "1019.84",
   *             "userAddress": "tz2D1s4VvB8HU8YrYGjKQJ3zXxiJw6QHyZQa",
   *             "userId": 3,
   *             "userName": "utan_second-hand_10",
   *             "userPicture": null
   *         },
   *         {
   *             "totalPaid": "25.00",
   *             "userAddress": "tz1WWcuiKUN4Ed5zouETqr7MbVzd3vkC4ubr",
   *             "userId": 16,
   *             "userName": "Rattlesnake_naive_7",
   *             "userPicture": null
   *         },
   *         ...
   *     ]
   * }
   * @apiName topBuyers
   */
  @Get('topBuyers')
  async topBuyers(
    @Query('currency') currency: string = BASE_CURRENCY,
    @Res() resp: Response,
  ) {
    validateRequestedCurrency(currency);
    return await wrapCache(
      this.cache,
      resp,
      'user.getTopBuyers' + currency,
      async () => {
        return this.userService.getTopBuyers(currency).then((topBuyers) => {
          return { topBuyers };
        });
      },
    );
  }

  /**
   * @apiGroup Users
   * @api {get} /users/nftOwnershipsPending Get pending ownership status for NFTs
   * @apiDescription This endpoint is used to find out after having finished payment whether the purchased NFTs have arrived to the user's wallet onchain or if this process is still pending.
   *
   * Note that a user can own multiple editions of a single NFT (though limited by 1 edition per NFT per cart,
   * users can own multiple editions regardless either through multiple payments or through onchain transfers). Therefore, this endpoint returns per requested nftId a list of ownerships.
   * @apiPermission logged-in user
   * @apiName nftOwnershipStatus
   */
  @Get('nftOwnershipsPending')
  @UseGuards(JwtAuthGuard)
  @Header('cache-control', 'no-store,must-revalidate')
  async nftOwnershipStatus(@CurrentUser() user: UserEntity) {
    const statuses = await this.userService.getNftPendingOwnershipInfo(
      user.userAddress,
      user.id,
    );

    let res: any = [];
    for (const nftId of Object.keys(statuses)) {
      res.push({
        nftId: nftId,
        ownerStatuses: statuses[Number(nftId)].map(
          (x: OwnershipInfo) => x.status,
        ),
      });
    }
    return res;
  }

  /**
   * @apiGroup Users
   * @api {post} /users/cart/add/:nftId Add an NFT to cart
   * @apiDescription Note, this may fail if
   * - This NFT is not for sale (e.g. it's already sold out, or it's not yet released, or its no longer on sale)
   * - All remaining editions of this NFT are already in other active carts
   * - This NFT is already in the active cart (currently we only allow 1 edition per NFT per active cart)
   * - This NFT is a proxied NFT, it can only be claimed on purchase of the related Proxy NFT
   * - The user's cart is full (there is an environment variable defining the maximum allowed cart size)
   * - The NFT id does not exist
   * @apiParam {Number} nftId The id of the NFT to add to the cart
   * @apiPermission logged-in user
   * @apiExample {http} Example http request url (make sure to replace $base_url with the store-api-server endpoint):
   *  $base_url/users/cart/add/10
   *
   * @apiName cartAdd
   */
  @Post('cart/add/:nftId')
  @UseGuards(JwtFailableAuthGuard)
  async cartAdd(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
    @Param('nftId') nftId: number,
  ) {
    const cartSession = await this.userService.getCartSession(
      cookieSession,
      user,
    );

    await this.userService.cartAdd(cartSession, nftId).catch((err: any) => {
      if (err instanceof HttpException) {
        throw err;
      }

      if (err?.code === PG_FOREIGN_KEY_VIOLATION_ERRCODE) {
        throw new HttpException(
          'This nft does not exist',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        throw new HttpException(
          'This nft is already in the cart',
          HttpStatus.BAD_REQUEST,
        );
      }

      Logger.error(
        `Error on adding nft to cart. cartSession=${cartSession}, nftId=${nftId}, err: ${err}`,
      );
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  }

  /**
   * @apiGroup Users
   * @api {post} /users/cart/remove/:nftId Remove an nft from the user's cart
   * @apiParam {Number} nftId The id of the nft
   * @apiPermission logged-in user
   * @apiExample {http} Example http request url (make sure to replace $base_url with the store-api-server endpoint):
   *  $base_url/users/cart/remove/10
   *
   * @apiName cartRemove
   */
  @Post('cart/remove/:nftId')
  @UseGuards(JwtFailableAuthGuard)
  async cartRemove(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
    @Param('nftId') nftId: number,
  ) {
    const cartSession = await this.userService.getCartSession(
      cookieSession,
      user,
    );

    const removed = await this.userService.cartRemove(cartSession, nftId);
    if (!removed) {
      throw new HttpException(
        'This nft was not in the cart',
        HttpStatus.BAD_REQUEST,
      );
    }
    // return 204 (successful delete, returning nothing)
    throw new HttpException('', HttpStatus.NO_CONTENT);
  }

  /**
   * @apiGroup Users
   * @api {get} /users/cart/list List all nfts in a cart
   * @apiDescription Will use the cookie session as the cart session if no logged-in user is provided
   * @apiQuery {String} [currency] The currency used, uses the base currency if not provided
   * @apiPermission logged-in user
   * @apiSuccessExample Example Success-Response:
   * {
   *   nfts: [
   *      {
   *        "id": 5,
   *        "name": "scotland",
   *        "description": "Thumbnail probably has nothing to do with Scotland. Maybe the guy is scottish. Who knows",
   *        "isProxy": false,
   *        "ipfsHash": "ipfs://QmVFPACwpMSMszsh26eBpBL33L5umUvkUCnYzJhqxzUS82",
   *        "metadataIpfs": "ipfs://QmVFPACwpMSMszsh26eBpBL33L5umUvkUCnYzJhqxzUS82",
   *        "artifactIpfs": null,
   *        "displayIpfs": null,
   *        "thumbnailIpfs": null,
   *        "artifactUri": "https://kanvas-admin-files.s3.amazonaws.com/NFT_FILE__5_image.png",
   *        "displayUri": "https://kanvas-admin-files.s3.amazonaws.com/NFT_FILE__5_image.png",
   *        "thumbnailUri": "https://kanvas-admin-files.s3.eu-central-1.amazonaws.com/NFT_FILE__5_thumbnail.png",
   *        "price": "0.30",
   *        "categories": [
   *            {
   *                "id": 10,
   *                "name": "Landscape",
   *                "description": "Sub photography category"
   *            }
   *        ],
   *        "metadata": null,
   *        "editionsSize": 10,
   *        "editionsAvailable": 7,
   *        "editionsSold": 3,
   *        "createdAt": 1645709306,
   *        "launchAt": 1647342000,
   *        "onsaleFrom": 1647342000,
   *        "mintOperationHash": null
   *      },
   *      ...
   *   ]
   * }
   *
   * @apiName cartList
   */
  @Get('cart/list')
  @UseGuards(JwtFailableAuthGuard)
  @Header('cache-control', 'no-store,must-revalidate')
  async cartList(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
    @Query('currency') currency: string = BASE_CURRENCY,
  ) {
    validateRequestedCurrency(currency);

    const cartSession = await this.userService.getCartSession(
      cookieSession,
      user,
    );
    return await this.userService.cartList(cartSession, currency);
  }
}
