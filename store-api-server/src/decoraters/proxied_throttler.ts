import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RATE_LIMITLESS_SECRET } from '../constants.js';

@Injectable()
export class ProxiedThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    if (
      typeof RATE_LIMITLESS_SECRET === 'string' &&
      req.headers['rate-limitless'] === RATE_LIMITLESS_SECRET
    ) {
      return uuidv4();
    }
    return req.ips.length ? req.ips[0] : req.ip;
  }
}
