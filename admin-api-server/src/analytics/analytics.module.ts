import { Module } from '@nestjs/common';
import { AnalyticsController } from './controller/analytics.controller.js';
import { AnalyticsService } from './service/analytics.service.js';
import { DbModule } from '../db.module.js';
import { CurrencyModule } from 'kanvas-api-lib';

@Module({
  imports: [DbModule, CurrencyModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
