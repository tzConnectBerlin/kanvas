require('dotenv').config();
import {
  Session,
  HttpException,
  HttpStatus,
  Body,
  Param,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Query,
  Get,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserEntity } from '../entity/user.entity';
import { UserService } from '../service/user.service';
import { CurrentUser } from '../../decoraters/user.decorator';
import {
  JwtAuthGuard,
  JwtFailableAuthGuard,
} from '../../authentication/guards/jwt-auth.guard';
import {
  PG_UNIQUE_VIOLATION_ERRCODE,
  PG_FOREIGN_KEY_VIOLATION_ERRCODE,
  PROFILE_PICTURE_MAX_BYTES,
} from '../../constants';

interface EditProfile {
  userName?: string;
}

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/profile')
  @UseGuards(JwtFailableAuthGuard)
  async getProfile(
    @CurrentUser() user?: UserEntity,
    @Query('userAddress') userAddress?: string,
  ) {
    const address =
      userAddress ||
      (typeof user !== 'undefined' ? user.userAddress : undefined);
    if (typeof address === 'undefined') {
      throw new HttpException(
        'Define userAddress parameter or access this endpoint logged in',
        HttpStatus.BAD_REQUEST,
      );
    }

    const profile_res = await this.userService.getProfile(address);
    if (!profile_res.ok) {
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
    return profile_res.val;
  }

  @Post('/profile/edit')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: { fileSize: PROFILE_PICTURE_MAX_BYTES },
    }),
  )
  async editProfile(
    @CurrentUser() currentUser: UserEntity,
    @Body() editFields: EditProfile,
    @UploadedFile() picture: any,
  ) {
    try {
      await this.userService.edit(
        currentUser.id,
        editFields?.userName,
        picture,
      );
    } catch (err: any) {
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        throw new HttpException(
          'This username is already taken',
          HttpStatus.BAD_REQUEST,
        );
      }

      Logger.warn(err);
      throw new HttpException(
        'Failed to edit profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/profile/edit/check')
  @UseGuards(JwtAuthGuard)
  async checkAllowedEdit(@Query('userName') userName: string) {
    const available = await this.userService.isNameAvailable(userName);
    return {
      userName: userName,
      available: available,
    };
  }

  @Post('nftOwnership')
  @UseGuards(JwtAuthGuard)
  async nftOwnershipStatus(
    @CurrentUser() user: UserEntity,
    @Query('nftIds') nftIdsQuery: string,
  ) {
    let nftIds: number[];
    try {
      nftIds = nftIdsQuery.split(',').map((v: string) => Number(v));
      if (nftIds.some((id: number) => Number.isNaN(id))) {
        throw `one or more requested nftIds is NaN`;
      }
    } catch (err: any) {
      throw new HttpException(
        'Bad nftIds query parameter, expected comma separated nft id numbers',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.userService.getNftOwnershipStatuses(user, nftIds);
  }

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

    const addedRes = await this.userService
      .cartAdd(cartSession, nftId)
      .catch((err: any) => {
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

    if (!addedRes.ok) {
      throw new HttpException(addedRes.val, HttpStatus.BAD_REQUEST);
    }
  }

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

  @Post('cart/list')
  @UseGuards(JwtFailableAuthGuard)
  async cartList(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
  ) {
    const cartSession = await this.userService.getCartSession(
      cookieSession,
      user,
    );
    return await this.userService.cartList(cartSession);
  }
}
