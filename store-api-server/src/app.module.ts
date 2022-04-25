import { APP_GUARD } from '@nestjs/core';
import { CacheModule, Module, MiddlewareConsumer } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CategoryModule } from './category/category.module';
import { NftModule } from './nft/nft.module';
import { UserModule } from './user/user.module';
import { AuthProviderModule } from './auth-provider/auth-provider.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { DbModule } from './db.module';
import { PaymentModule } from './payment/payment.module';
import { LoggerMiddleware, StatsLogger } from './middleware/logger';
import { CookieSessionMiddleware } from './middleware/cookie_session';
import { ProxiedThrottlerGuard } from './decoraters/proxied_throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CurrencyConverter } from './currency-converter.service';
import {
  RATE_LIMIT_TTL,
  RATE_LIMIT,
  CACHE_TTL,
  CACHE_SIZE,
} from 'src/constants';

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
    CurrencyConverter,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CookieSessionMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
