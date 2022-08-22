import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './controller/auth.controller.js';
import { AuthService } from './service/auth.service.js';
import { JwtStrategy } from './strategy/jwt.strategy.js';
import { LocalStrategy } from './strategy/local.strategy.js';

@Module({
  providers: [AuthService, JwtStrategy, LocalStrategy],
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
