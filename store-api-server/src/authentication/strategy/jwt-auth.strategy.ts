import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ITokenPayload } from '../../interfaces/token.interface.js';
import { assertEnv } from '../../utils.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: assertEnv('JWT_PUBLIC_KEY'),
    });
  }

  async validate(payload: ITokenPayload) {
    return {
      id: payload.id,
      userAddress: payload.userAddress,
      createdAt: payload.createdAt,
    };
  }
}
