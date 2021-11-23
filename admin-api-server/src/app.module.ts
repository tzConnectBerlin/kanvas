import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UserModule } from './user/user.module';
import { NftModule } from './nft/nft.module';

@Module({
  imports: [AuthModule, UsersModule, UserModule, NftModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
