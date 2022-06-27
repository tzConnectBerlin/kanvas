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
import { CACHE_SIZE, BEHIND_PROXY } from '../constants.js';

@Injectable()
export class StatsLogger {
  private logger = new Logger('STATS');
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async logStats() {
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
    const realIp = BEHIND_PROXY ? request.get('X-Forwarded-For') || ip : ip;
    const timeStart = new Date();

    const fields = [
      method,
      originalUrl,
      userAgent,
      realIp,
      `sess:${cookieSession}`,
    ];

    this.logger.log(`>> ${fields.join(' ')}`);

    response.on('finish', () => {
      const timeEnd: Date = new Date();
      const duration = `${timeEnd.getTime() - timeStart.getTime()}ms`;
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      fields.push('=>');
      fields.push(`${statusCode}`);
      fields.push(contentLength);
      fields.push(duration);

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
