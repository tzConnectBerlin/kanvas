import { Module } from '@nestjs/common';
import { AnalyticsController } from './controller/analytics.controller';
import { AnalyticsService } from './service/analytics.service';
import { DbModule } from 'src/db.module';
import { CurrencyModule } from 'kanvas_lib';

@Module({
  imports: [DbModule, CurrencyModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
