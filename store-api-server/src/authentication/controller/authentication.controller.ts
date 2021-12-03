import {
  HttpStatus,
  HttpException,
  Logger,
  Request,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/decoraters/user.decorator';
import { UserEntity } from 'src/user/entity/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticationService } from '../service/authentication.service';
import { PG_UNIQUE_VIOLATION_ERRCODE } from '../../constants';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Get('logged_user')
  @UseGuards(JwtAuthGuard)
  async loggedUser(@CurrentUser() currentUser: UserEntity): Promise<any> {
    const loggedInUserRes = await this.authService.getLoggedUser(
      currentUser.userAddress,
    );
    if (!loggedInUserRes.ok) {
      throw new HttpException(
        'Failed to find user associated to JWT',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return loggedInUserRes.val;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() currentUser: UserEntity, @Request() req: any) {
    const resetCookieSessionRes =
      await this.authService.isUserAttachedToCookieSession(
        currentUser.id,
        req.session.uuid,
      );
    if (resetCookieSessionRes.ok && resetCookieSessionRes.val) {
      // Detach session. User that is logging out is attached in some way to the
      // current session, don't want to stay attached to this on the active
      // device.
      req.session = null;
    }
  }

  @Post('login')
  async login(@Body() user: UserEntity): Promise<any> {
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() user: UserEntity): Promise<any> {
    return this.authService.register(user).catch((err: any) => {
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        throw new HttpException(
          'User with these credentials already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      Logger.error(
        `Error on creating user=${JSON.stringify(user)}, err: ${err}`,
      );
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  }
}
