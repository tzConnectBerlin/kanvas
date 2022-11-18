import {
  HttpStatus,
  HttpException,
  Logger,
  Request,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../decoraters/user.decorator.js';
import { UserEntity } from '../../user/entity/user.entity.js';
import {
  JwtAuthGuard,
  JwtFailableAuthGuard,
} from '../guards/jwt-auth.guard.js';
import { AuthenticationService } from '../service/authentication.service.js';
import {
  PG_UNIQUE_VIOLATION_ERRCODE,
  SIGNED_LOGIN_ENABLED,
} from '../../constants.js';
import { TokenGateEndpointInfo } from '../entity/authentication.entity.js';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  /**
   * @apiGroup Auth
   * @apiPermission logged-in user
   * @api {get} /auth/logged_user Get the logger user
   * @apiSuccessExample Example Success-Response:
   *    {
   *       "id": 60,
   *       "userAddress": "anyuseraddress",
   *       "createdAt": 1668681043,
   *       "profilePicture": null
   *     }
   * @apiName loggedUser
   */
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

  /**
   * @apiGroup Auth
   * @api {post} /auth/logout Logout the current user
   * @apiPermission logged-in user
   * @apiName logout
   */
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
  /**
   * @apiGroup Auth
   * @api {post} /auth/login Login a user
   * @apiBody {UserEntity} user The user who wants to log in
   * @apiBody {String} user[userAddress] The user address used to login
   * @apiBody {String} user[signedPayload] The user password used to login
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "userAddress": "$user_address",
   *      "signedPayload": "$user_password",
   *    }
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *      "token": "eyJhbGciOPDfq6idU...",
   *      "id": 60,
   *      "maxAge": "86400000",
   *      "userAddress": "anyuseraddress"
   *    }
   *
   * @apiName login
   */

  @Post('login')
  async login(@Body() user: UserEntity): Promise<any> {
    try {
      return await this.authService.login(user);
    } catch (err: any) {
      if (!(err instanceof HttpException)) {
        throw err;
      }

      if (err.getStatus() === 400 && !SIGNED_LOGIN_ENABLED) {
        await this.register(user);

        return await this.authService.login(user);
      } else {
        throw err;
      }
    }
  }

  /**
   * @apiGroup Auth
   * @api {post} /auth/register Register a user
   * @apiBody {UserEntity} user The user to be registered.
   * @apiBody {String} user[userAddress] The user address from the user.
   * @apiBody {String} user[profilePicture] The profile picture for the user.
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "userAddress": "anyaddress",
   *      "profilePicture": "anypicture",
   *    }
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *      "userAddress": "anyaddress",
   *      "profilePicture": "anypicture",
   *      "id": 64
   *    }
   * @apiName register
   */
  @Post('register')
  async register(@Body() user: UserEntity): Promise<any> {
    return this.authService.register(user).catch((err: any) => {
      if (err?.code === PG_UNIQUE_VIOLATION_ERRCODE) {
        throw new HttpException(
          'User with these credentials already exists',
          HttpStatus.FORBIDDEN,
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

  /**
   * @apiGroup Auth
   * @api {get} /auth/token-gate/tokens Get owned tokens by user
   * @apiPermission logged-in user
   * @apiSuccessExample Example Success-Response:
   *    ["common"]
   * @apiName tokenGateOwnedTokens
   */
  @Get('token-gate/tokens')
  @UseGuards(JwtFailableAuthGuard)
  async tokenGateOwnedTokens(
    @CurrentUser() user?: UserEntity,
  ): Promise<(number | string)[]> {
    if (typeof user === 'undefined') {
      return [];
    }
    return await this.authService.tokenGateOwnedTokens(user.userAddress);
  }

  /**
   * @apiGroup Auth
   * @api {get} /auth/token-gate/endpoint Get client allowance for token-gate endpoint
   * @apiPermission logged-in user
   * @apiQuery {String} endpoint The endpoint in question
   * @apiSuccessExample Example Success-Response:
   *    {
   *        userOwnsTokens: ["common"],
   *        allowedTokens: ["rare"],
   *        userHasAccess: false,
   *    }
   *
   * @apiName tokenGateEndpointInfo
   */
  @Get('token-gate/endpoint')
  @UseGuards(JwtFailableAuthGuard)
  async tokenGateEndpointInfo(
    @Query('endpoint') endpoint: string,
    @CurrentUser() user?: UserEntity,
  ): Promise<TokenGateEndpointInfo> {
    return await this.authService.tokenGateEndpointInfo(
      endpoint,
      user?.userAddress,
    );
  }
}
