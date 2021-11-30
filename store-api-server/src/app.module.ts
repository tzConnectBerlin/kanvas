import { Module, MiddlewareConsumer } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CategoryModule } from './category/category.module'
import { NftModule } from './nft/nft.module'
import { UserModule } from './user/user.module'
import { AuthProviderModule } from './auth-provider/auth-provider.module'
import { AuthenticationModule } from './authentication/authentication.module'
import { DbModule } from './db.module'
import { LoggerMiddleware } from './middleware/logger'
import { CookieSessionMiddleware } from './middleware/cookie_session'

@Module({
  imports: [
    AuthenticationModule,
    CategoryModule,
    NftModule,
    UserModule,
    AuthProviderModule,
    DbModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CookieSessionMiddleware, LoggerMiddleware).forRoutes('*')
  }
}
