import { APP_GUARD } from '@nestjs/core';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoryModule } from './category/category.module';
import { NftModule } from './nft/nft.module';
import { UserModule } from './user/user.module';
import { AuthProviderModule } from './auth-provider/auth-provider.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { DbModule } from './db.module';
import { LoggerMiddleware } from './middleware/logger';
import { CookieSessionMiddleware } from './middleware/cookie_session';
import { ProxiedThrottlerGuard } from './decoraters/proxied_throttler';
import { RATE_LIMIT_WINDOW_SECS, RATE_LIMIT } from 'src/constants';

@Module({
  imports: [
    AuthenticationModule,
    CategoryModule,
    NftModule,
    UserModule,
    AuthProviderModule,
    DbModule,
    ThrottlerModule.forRoot({
      ttl: RATE_LIMIT_WINDOW_SECS,
      limit: RATE_LIMIT,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ProxiedThrottlerGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CookieSessionMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
