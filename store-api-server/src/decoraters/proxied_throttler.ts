import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { API_KEY_SECRET } from '../constants.js';

@Injectable()
export class ProxiedThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    if (
      typeof API_KEY_SECRET === 'string' &&
      req.headers['api-key'] === API_KEY_SECRET
    ) {
      return uuidv4();
    }
    return req.ips.length ? req.ips[0] : req.ip;
  }
}
