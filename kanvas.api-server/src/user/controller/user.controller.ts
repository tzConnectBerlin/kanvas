require('dotenv').config()
import {
  Session,
  HttpException,
  HttpStatus,
  Param,
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { UserEntity } from '../entity/user.entity'
import { UserService } from '../service/user.service'
import { CurrentUser } from 'src/decoraters/user.decorator'
import {
  JwtAuthGuard,
  JwtFailableAuthGuard,
} from 'src/authentication/guards/jwt-auth.guard'
import { PG_UNIQUE_VIOLATION_ERRCODE } from '../../constants'

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() user: UserEntity): Promise<UserEntity> {
    return await this.userService.create(user).catch((err: any) => {
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        throw new HttpException(
          'User with these credentials already exists',
          HttpStatus.BAD_REQUEST,
        )
      }

      Logger.error(
        'Error on creating user=' + JSON.stringify(user) + ', err: ' + err,
      )
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })
  }

  @Post('cart/add/:nftId')
  @UseGuards(JwtFailableAuthGuard)
  async cartAdd(
    @Session() session: any,
    @CurrentUser() user: UserEntity | undefined,
    @Param('nftId') nftId: number,
  ) {
    const cart_session = await this.get_cart_session(session, user)
    const added = await this.userService
      .cartAdd(cart_session, nftId)
      .catch((err: any) => {
        if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
          throw new HttpException(
            'This nft is already in the cart',
            HttpStatus.BAD_REQUEST,
          )
        }

        Logger.error(
          'Error on adding nft to cart. cart_session=' +
            cart_session +
            ', nft_id=' +
            nftId +
            ', err: ' +
            err,
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
    @Session() session: any,
    @CurrentUser() user: UserEntity | undefined,
    @Param('nftId') nftId: number,
  ) {
    const cart_session = await this.get_cart_session(session, user)
    const removed = await this.userService.cartRemove(cart_session, nftId)
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
    @Session() session: any,
    @CurrentUser() user: UserEntity | undefined,
  ) {
    const cart_session = await this.get_cart_session(session, user)
    return await this.userService.cartList(cart_session)
  }

  @Post('cart/checkout')
  @UseGuards(JwtAuthGuard)
  async cartCheckout(@CurrentUser() user: UserEntity) {
    return await this.userService.cartCheckout(user)
  }

  async get_cart_session(
    session: any,
    user: UserEntity | undefined,
  ): Promise<string> {
    console.log(session.uuid, ' ', JSON.stringify(user))
    if (typeof user === 'undefined') {
      return session.uuid
    }
    return await this.userService.ensureUserCartSession(user.id, session.uuid)
  }
}
