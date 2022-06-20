import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../../user/entity/user.entity.js';
import { UserService } from '../../user/service/user.service.js';
import { ITokenPayload } from '../../interfaces/token.interface.js';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Result } from 'ts-results';
import ts_results from 'ts-results';
import { SIGNED_LOGIN_ENABLED } from '../../constants.js';
const { Ok } = ts_results;

import { createRequire } from 'module';

import type { IAuthentication } from './authentication.js';

const require = createRequire(import.meta.url);
const bcrypt = require('bcrypt');

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  private async validate(
    userData: UserEntity,
  ): Promise<Result<UserEntity, string>> {
    return await this.userService.findByAddress(userData.userAddress);
  }

  public async login(userData: UserEntity): Promise<any | { status: number }> {
    const userRes = await this.validate(userData);
    if (!userRes.ok) {
      throw new HttpException('User not registered', HttpStatus.BAD_REQUEST);
    }
    const user = userRes.val;

    if (SIGNED_LOGIN_ENABLED) {
      if (
        user.signedPayload !== undefined &&
        userData.signedPayload !== undefined
      ) {
        await this.verifyPassword(userData.signedPayload, user.signedPayload);
      }
    }

    return this.getCookieWithJwtToken(
      {
        id: user.id,
        userAddress: user.userAddress,
      },
      user,
    );
  }

  public async getLoggedUser(
    address: string,
  ): Promise<Result<UserEntity, string>> {
    const userRes = await this.userService.findByAddress(address);
    if (userRes.ok) {
      delete userRes.val.signedPayload;
    }

    return userRes;
  }

  public async isUserAttachedToCookieSession(
    userId: number,
    cookieSession: string,
  ): Promise<Result<boolean, string>> {
    let isAttached = false;

    const cartSessionRes = await this.userService.getUserCartSession(userId);
    if (!cartSessionRes.ok) {
      return cartSessionRes;
    }
    if (cartSessionRes.ok) {
      isAttached ||= cartSessionRes.val === cookieSession;
    }

    return Ok(isAttached);
  }

  public async register(user: UserEntity): Promise<any> {
    let newUser = { ...user };
    if (SIGNED_LOGIN_ENABLED) {
      newUser.signedPayload = await bcrypt.hash(user.signedPayload, 10);
    }

    const createdUser = await this.userService.create(newUser);

    createdUser.signedPayload = undefined;

    return createdUser;
  }

  private async verifyPassword(
    signedKanvasPayload: string,
    hashedsignedKanvasPayload: string,
  ) {
    const issignedKanvasPayloadMatching = await bcrypt.compare(
      signedKanvasPayload,
      hashedsignedKanvasPayload,
    );
    if (!issignedKanvasPayloadMatching) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  public getCookieWithJwtToken(
    data: ITokenPayload,
    user: UserEntity,
  ): IAuthentication {
    const payload: ITokenPayload = data;
    const token = this.jwtService.sign(payload);

    if (typeof process.env.JWT_EXPIRATION_TIME == 'string') {
      return {
        token: token,
        id: user.id,
        maxAge: process.env.JWT_EXPIRATION_TIME,
        userAddress: data.userAddress,
      };
    } else {
      throw new Error('process.env.JWT_EXPIRATION_TIME not set');
    }
  }
}
