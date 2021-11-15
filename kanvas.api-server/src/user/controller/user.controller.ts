require('dotenv').config()
import {
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
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard'
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
  @UseGuards(JwtAuthGuard)
  async cartAdd(
    @CurrentUser() user: UserEntity,
    @Param('nftId') nftId: number,
  ) {
    return await this.userService.cartAdd(user, nftId).catch((err: any) => {
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        throw new HttpException(
          'This nft is already in the cart',
          HttpStatus.BAD_REQUEST,
        )
      }

      Logger.error(
        'Error on adding nft to cart. user_id=' +
          user.id +
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
  }

  @Post('cart/remove/:nftId')
  @UseGuards(JwtAuthGuard)
  async cartRemove(
    @CurrentUser() user: UserEntity,
    @Param('nftId') nftId: number,
  ) {
    const removed = await this.userService.cartRemove(user, nftId)
    if (!removed) {
      throw new HttpException(
        'This nft was not in the cart',
        HttpStatus.BAD_REQUEST,
      )
    }
    // return 204 (successful delete, returning nothing)
    throw new HttpException('', HttpStatus.NO_CONTENT)
  }

  @Get('cart')
  @UseGuards(JwtAuthGuard)
  async getCart(@CurrentUser() user: UserEntity) {
    return await this.userService.getCart(user)
  }
}
