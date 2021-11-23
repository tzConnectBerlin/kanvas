require('dotenv').config()
import {
  Session,
  HttpException,
  HttpStatus,
  Param,
  Controller,
  Post,
  Query,
  Get,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { UserEntity } from '../entity/user.entity'
import { UserService } from '../service/user.service'
import { CurrentUser } from '../../decoraters/user.decorator'
import {
  JwtAuthGuard,
  JwtFailableAuthGuard,
} from '../../authentication/guards/jwt-auth.guard'
import { PG_UNIQUE_VIOLATION_ERRCODE } from '../../constants'

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtFailableAuthGuard)
  async getProfile(
    @CurrentUser() user?: UserEntity,
    @Query('userAddress') userAddress?: string,
  ) {
    const address =
      userAddress || (typeof user !== 'undefined' ? user.address : undefined)
    if (typeof address === 'undefined') {
      throw new HttpException(
        'Define userAddress parameter or access this endpoint logged in',
        HttpStatus.BAD_REQUEST,
      )
    }

    const profile_res = await this.userService.getProfile(address)
    if (!profile_res.ok) {
      if (typeof userAddress === 'undefined') {
        throw new HttpException(
          'Failed to find user associated to JWT',
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
      throw new HttpException(
        'No user registered with requested userAddress',
        HttpStatus.BAD_REQUEST,
      )
    }
    return profile_res.val
  }

  // @Get('/edit/check')
  // async checkAllowedEdit() {}

  @Post('cart/add/:nftId')
  @UseGuards(JwtFailableAuthGuard)
  async cartAdd(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
    @Param('nftId') nftId: number,
  ) {
    const cartSession = await this.getCartSession(cookieSession, user)
    const added = await this.userService
      .cartAdd(cartSession, nftId)
      .catch((err: any) => {
        if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
          throw new HttpException(
            'This nft is already in the cart',
            HttpStatus.BAD_REQUEST,
          )
        }

        Logger.error(
          `Error on adding nft to cart. cartSession=${cartSession}, nftId=${nftId}, err: ${err}`,
        )
        throw new HttpException(
          'Something went wrong',
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!added) {
      throw new HttpException(
        'All editions of this nft have been reserved/bought',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('cart/remove/:nftId')
  @UseGuards(JwtFailableAuthGuard)
  async cartRemove(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
    @Param('nftId') nftId: number,
  ) {
    const cartSession = await this.getCartSession(cookieSession, user)
    const removed = await this.userService.cartRemove(cartSession, nftId)
    if (!removed) {
      throw new HttpException(
        'This nft was not in the cart',
        HttpStatus.BAD_REQUEST,
      )
    }
    // return 204 (successful delete, returning nothing)
    throw new HttpException('', HttpStatus.NO_CONTENT)
  }

  @Get('cart/list')
  @UseGuards(JwtFailableAuthGuard)
  async cartList(
    @Session() cookieSession: any,
    @CurrentUser() user: UserEntity | undefined,
  ) {
    const cartSession = await this.getCartSession(cookieSession, user)
    return await this.userService.cartList(cartSession)
  }

  @Post('cart/checkout')
  @UseGuards(JwtAuthGuard)
  async cartCheckout(@CurrentUser() user: UserEntity) {
    const cartSession = await this.userService.getUserCartSession(user.id)
    if (typeof cartSession === 'undefined') {
      throw new HttpException('User has no active cart', HttpStatus.BAD_REQUEST)
    }
    const success = await this.userService.cartCheckout(user.id, cartSession)
    if (!success) {
      throw new HttpException(
        'Empty cart cannot be checked out',
        HttpStatus.BAD_REQUEST,
      )
    }
    // return 204 (applied, returning nothing)
    throw new HttpException('', HttpStatus.NO_CONTENT)
  }

  async getCartSession(
    cookieSession: any,
    user: UserEntity | undefined,
  ): Promise<string> {
    if (typeof user === 'undefined') {
      return cookieSession.uuid
    }
    return await this.userService.ensureUserCartSession(
      user.id,
      cookieSession.uuid,
    )
  }
}
