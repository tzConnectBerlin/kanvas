import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ITokenPayload } from 'src/interfaces/token.interface';
import { assertEnv } from 'src/utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: assertEnv('JWT_SECRET'),
    });
  }

  async validate(payload: ITokenPayload) {
    return {
      id: payload.id,
      userName: payload.userName,
      userAddress: payload.userAddress,
      roles: payload.roles,
    };
  }
}
