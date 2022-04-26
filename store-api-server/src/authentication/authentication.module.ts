import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { AuthenticationService } from './service/authentication.service';
import { AuthenticationController } from 'src/authentication/controller/authentication.controller';
import { JwtStrategy } from './strategy/jwt-auth.strategy';
import { DbModule } from 'src/db.module';
import { S3Service } from 'src/s3.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    DbModule,
    UserModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, JwtStrategy, S3Service],
  exports: [AuthenticationService, JwtStrategy],
})
export class AuthenticationModule {}
