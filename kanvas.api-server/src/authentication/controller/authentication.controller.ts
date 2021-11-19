import {
  HttpStatus,
  HttpException,
  Logger,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from 'src/decoraters/user.decorator'
import { UserEntity } from 'src/user/entity/user.entity'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { AuthenticationService } from '../service/authentication.service'
import { PG_UNIQUE_VIOLATION_ERRCODE } from '../../constants'

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Get('logged_user')
  @UseGuards(JwtAuthGuard)
  async loggedUser(@CurrentUser() currentUser: UserEntity): Promise<any> {
    const loggedInUser = this.authService.getLoggedUser(currentUser.address)
    if (typeof loggedInUser === 'undefined') {
      throw new HttpException(
        'Failed to find user associated to JWT',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    return loggedInUser
  }

  @Post('login')
  async login(@Body() user: UserEntity): Promise<any> {
    return this.authService.login(user)
  }

  @Post('register')
  async register(@Body() user: UserEntity): Promise<any> {
    return this.authService.register(user).catch((err: any) => {
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        throw new HttpException(
          'User with these credentials already exists',
          HttpStatus.BAD_REQUEST,
        )
      }

      Logger.error(
        `Error on creating user=${JSON.stringify(user)}, err: ${err}`,
      )
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })
  }
}
