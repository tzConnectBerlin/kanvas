import { JwtService } from '@nestjs/jwt';
import {
  UserEntity,
  UserEntityWithWalletData,
} from '../../user/entity/user.entity.js';
import { validateAddress } from '@taquito/utils';
import { UserService } from '../../user/service/user.service.js';
import { ITokenPayload } from '../../interfaces/token.interface.js';
import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { Result } from 'ts-results';
import validator from 'validator';
import ts_results from 'ts-results';
import { SIGNED_LOGIN_ENABLED, TOKEN_GATE } from '../../constants.js';
const { Ok } = ts_results;

import type { IAuthentication } from './authentication.js';
import { TokenGate } from 'token-gate';
import { TokenGateEndpointInfo } from '../entity/authentication.entity.js';
import { maybe } from '../../utils.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcrypt');

export const USER_NOT_REGISTERED_ERR_MSG = 'User not registered';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(TOKEN_GATE) private tokenGate: TokenGate,
  ) {}

  async #validate(userData: UserEntity): Promise<Result<UserEntity, string>> {
    return await this.userService.findByAddress(userData.userAddress);
  }

  async login(
    userData: UserEntityWithWalletData,
  ): Promise<any | { status: number }> {
    const userRes = await this.#validate(userData);
    if (!userRes.ok) {
      throw new HttpException(
        USER_NOT_REGISTERED_ERR_MSG,
        HttpStatus.BAD_REQUEST,
      );
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

    if (typeof userData.walletProvider !== 'undefined') {
      if (
        typeof userData.ssoEmail !== 'undefined' &&
        !validator.isEmail(userData.ssoEmail, {
          allow_ip_domain: true,
        })
      ) {
        throw new HttpException('Invalid ssoEmail', HttpStatus.BAD_REQUEST);
      }

      await this.userService.registerWalletData({
        address: userData.userAddress,
        provider: userData.walletProvider,

        ssoType: userData.ssoType,
        ssoId: userData.ssoId,
        ssoEmail: userData.ssoEmail,
      });
    }

    return this.getCookieWithJwtToken(
      {
        id: user.id,
        userAddress: user.userAddress,
        createdAt: user.createdAt,
      },
      user,
    );
  }

  async tokenGateEndpointInfo(
    endpoint: string,
    address: string | undefined,
  ): Promise<TokenGateEndpointInfo> {
    let userOwnsTokensPromise = maybe(address, (addr) =>
      this.tokenGateOwnedTokens(addr),
    );

    const [userOwnsTokens, userHasAccess] = await Promise.all([
      userOwnsTokensPromise,
      this.tokenGate.hasAccess(endpoint, address),
    ]);

    return {
      userOwnsTokens: userOwnsTokens ?? [],
      allowedTokens: this.tokenGate.getEndpointAllowedTokens(endpoint),
      userHasAccess,
    };
  }

  async tokenGateOwnedTokens(address: string): Promise<(number | string)[]> {
    return await this.tokenGate.getOwnedTokens(address);
  }

  async getLoggedUser(address: string): Promise<Result<UserEntity, string>> {
    const userRes = await this.userService.findByAddress(address);
    if (userRes.ok) {
      delete userRes.val.signedPayload;
    }

    return userRes;
  }

  async isUserAttachedToCookieSession(
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

  async register(user: UserEntity): Promise<any> {
    if (!this.#isWalletAddressValid(user.userAddress)) {
      throw new HttpException('Invalid wallet address', HttpStatus.BAD_REQUEST);
    }
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

  getCookieWithJwtToken(
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

  #isWalletAddressValid(addr: string): boolean {
    const VALID = 3;
    return validateAddress(addr) == VALID;
  }
}
