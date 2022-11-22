import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../service/auth.service.js';
import { UserEntity } from '../../user/entities/user.entity';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * @apiGroup Auth
   * @api {post} /auth/login Login as user
   * @apiBody {Object} user User object.
   * @apiBody {String} user[username] e.g. max@muster.com
   * @apiBody {String} user[password] e.g. 123456
   * @apiParamExample {json} Request Body Example:
   *    {
   *      "username": "max@muster.com",
   *      "password": "123456"
   *    }
   *
   * @apiSuccessExample Example Success-Response ($access_token represents your Bearer token):
   *    {
   *      "accessToken": $access_token,
   *    }
   * @apiName login
   */
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() request: { user: UserEntity }) {
    return this.authService.login(request.user);
  }
}
