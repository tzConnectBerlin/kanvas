import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ITokenPayload } from 'src/interfaces/token.interface';
import { assert } from 'src/utils'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        assert(typeof process.env.JWT_SECRET === 'string', "You must set environment variable JWT_SECRET before starting this program")
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET
        });
    }

    async validate(payload: ITokenPayload) {
        return {
            id: payload.id,
            name: payload.name,
            address: payload.address,
            roles: payload.roles
        };
    }
}
