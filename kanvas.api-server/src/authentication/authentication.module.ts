import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/service/user.service';
import { AuthenticationService } from './service/authentication.service';
import { AuthenticationController } from 'src/authentication/controller/authentication.controller';
import { JwtStrategy } from './strategy/jwt-auth.strategy';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
        secret: process.env.JWT_SECRET
    })],
    controllers: [AuthenticationController],
    providers: [UserService, AuthenticationService, JwtStrategy],
    exports: [AuthenticationService, JwtStrategy]
})
export class AuthenticationModule {}
