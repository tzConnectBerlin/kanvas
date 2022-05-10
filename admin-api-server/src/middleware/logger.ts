import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { BEHIND_PROXY } from '../constants';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const cookieSession = (request as any).session?.uuid.slice(0, 5) || '';
    const realIp = BEHIND_PROXY ? request.get('X-Forwarded-For') || ip : ip;

    this.logger.log(
      `>> ${method} ${originalUrl} - ${userAgent} ${realIp} sess:${cookieSession}`,
    );

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');

      this.logger.log(
        `  << ${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${realIp} sess:${cookieSession}`,
      );
    });

    next();
  }
}
