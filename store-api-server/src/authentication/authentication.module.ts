import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module.js';
import { AuthenticationService } from './service/authentication.service.js';
import { AuthenticationController } from '../authentication/controller/authentication.controller.js';
import { JwtStrategy } from './strategy/jwt-auth.strategy.js';
import { DbModule } from '../db.module.js';
import { S3Service } from '../s3.service.js';
import { TokenGateModule } from '../tokenGate.module.js';
import { JWT_SECRET } from '../constants.js';

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
    }),
    DbModule,
    UserModule,
    TokenGateModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, JwtStrategy, S3Service],
  exports: [AuthenticationService, JwtStrategy],
})
export class AuthenticationModule {}
