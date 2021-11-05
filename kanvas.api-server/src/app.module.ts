import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CategoryModule } from './category/category.module'
import { NftModule } from './nft/nft.module'
import { UserModule } from './user/user.module'
import { AuthProviderModule } from './auth-provider/auth-provider.module'
import { AuthenticationModule } from './authentication/authentication.module'

@Module({
  imports: [
    AuthenticationModule,
    CategoryModule,
    NftModule,
    UserModule,
    AuthProviderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
