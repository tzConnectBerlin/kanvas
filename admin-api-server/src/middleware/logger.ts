import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { getClientIp } from '../utils.js';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const cookieSession = (request as any).session?.uuid.slice(0, 5) || '';
    const clientIp = getClientIp(request);
    const timeStart = new Date();

    const fields = [
      method,
      originalUrl,
      userAgent,
      clientIp,
      `sess:${cookieSession}`,
      '=>',
    ];

    let closure = false;

    response.on('error', (err) => {
      closure = true;

      fields.push(`-err: ${err}-`);
    });

    response.on('finish', () => {
      closure = true;

      const timeEnd: Date = new Date();
      const duration = `${timeEnd.getTime() - timeStart.getTime()}ms`;
      const { statusCode } = response;
      const contentLength = response.get('content-length') ?? '0';

      fields.push(`${statusCode}`);
      fields.push(contentLength);
      fields.push(duration);
    });

    response.on('close', () => {
      if (!closure) {
        const timeEnd: Date = new Date();
        const duration = `${timeEnd.getTime() - timeStart.getTime()}ms`;

        fields.push('client-aborted');
        fields.push(duration);
      }

      this.logger.log(fields.join(' '));
    });

    next();
  }
}
