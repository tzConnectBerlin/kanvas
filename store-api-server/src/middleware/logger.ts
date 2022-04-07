import { Request, Response, NextFunction } from 'express';
import {
  Injectable,
  Inject,
  CACHE_MANAGER,
  NestMiddleware,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Cache } from 'cache-manager';
import { CACHE_SIZE } from 'src/constants';

@Injectable()
export class StatsLogger {
  private logger = new Logger('STATS');
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async logStats() {
    console.log('logging stats...');
    const store: any = this.cache.store;

    const countFunc = store.itemCount;
    const pruneFunc = store.prune;
    if (typeof countFunc === 'undefined' || typeof pruneFunc === 'undefined') {
      this.logger.warn(
        'cannot log cache statistics, "itemCount" or "prune" function is undefined',
      );
      return;
    }

    await store.prune();
    const itemCount = await countFunc();
    this.logger.log(`cache size: ${itemCount}/${CACHE_SIZE}`);
  }
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  constructor() {}

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const cookieSession = request.session?.uuid.slice(0, 5) || '';
    const realIp = request.get('x-real-ip') || ip;

    const fields = [
      method,
      originalUrl,
      userAgent,
      realIp,
      `sess:${cookieSession}`,
    ];

    this.logger.log(`>> ${fields.join(' ')}`);

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      fields.push('=>');
      fields.push(`${statusCode}`);
      fields.push(contentLength);

      switch (response.get('cached')) {
        case 'yes':
          fields.push('cached');
          break;
        case 'no':
          fields.push('uncached');
          break;
      }

      this.logger.log(`  << ${fields.join(' ')}`);
    });

    next();
  }
}
