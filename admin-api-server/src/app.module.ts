import { APP_GUARD } from '@nestjs/core';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { NftModule } from './nft/nft.module';
import { CategoryModule } from './category/category.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RoleModule } from './role/role.module';
import { LoggerMiddleware } from './middleware/logger';
import { CookieSessionMiddleware } from './middleware/cookie_session';
import { ProxiedThrottlerGuard } from './decoraters/proxied_throttler';
import { RATE_LIMIT_WINDOW_SECS, RATE_LIMIT } from 'src/constants';

@Module({
  imports: [
    AuthModule,
    UserModule,
    NftModule,
    CategoryModule,
    AnalyticsModule,
    RoleModule,
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
