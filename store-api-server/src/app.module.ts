import { APP_GUARD } from '@nestjs/core';
import { CacheModule, Module, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CurrencyModule } from 'kanvas-api-lib';
import { CategoryModule } from './category/category.module.js';
import { NftModule } from './nft/nft.module.js';
import { UserModule } from './user/user.module.js';
import { AuthProviderModule } from './auth-provider/auth-provider.module.js';
import { AuthenticationModule } from './authentication/authentication.module.js';
import { DbModule } from './db.module.js';
import { PaymentModule } from './payment/payment.module.js';
import { LoggerMiddleware, StatsLogger } from './middleware/logger.js';
import { CookieSessionMiddleware } from './middleware/cookie_session.js';
import { ProxiedThrottlerGuard } from './decoraters/proxied_throttler.js';
import {
  RATE_LIMIT_TTL,
  RATE_LIMIT,
  CACHE_TTL,
  CACHE_SIZE,
} from './constants.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthenticationModule,
    CategoryModule,
    NftModule,
    UserModule,
    AuthProviderModule,
    PaymentModule,
    DbModule,
    CurrencyModule,
    ThrottlerModule.forRoot({
      ttl: RATE_LIMIT_TTL,
      limit: RATE_LIMIT,
    }),
    CacheModule.register({
      ttl: CACHE_TTL,
      max: CACHE_SIZE,
      isGlobal: true,
    }),
  ],
  providers: [
    StatsLogger,
    { provide: APP_GUARD, useClass: ProxiedThrottlerGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CookieSessionMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
