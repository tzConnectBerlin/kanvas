import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CurrencyModule } from 'kanvas-api-lib';

import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { NftModule } from './nft/nft.module.js';
import { CategoryModule } from './category/category.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { RoleModule } from './role/role.module.js';
import { LoggerMiddleware } from './middleware/logger.js';
import { CookieSessionMiddleware } from './middleware/cookie_session.js';
import { ProxiedThrottlerGuard } from './decoraters/proxied_throttler.js';
import { RATE_LIMIT_WINDOW_SECS, RATE_LIMIT } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'public'),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    NftModule,
    CategoryModule,
    AnalyticsModule,
    RoleModule,
    CurrencyModule.forRoot(),
    ThrottlerModule.forRoot({
      ttl: RATE_LIMIT_WINDOW_SECS,
      limit: RATE_LIMIT,
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ProxiedThrottlerGuard }],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CookieSessionMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
