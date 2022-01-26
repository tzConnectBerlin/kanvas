import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  MetricEntity,
  MetricParams,
  Resolution,
} from '../../analytics/entity/analytics.entity';
import { AnalyticsService } from '../service/analytics.service';
import { enumFromStringValue } from 'src/utils';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('sales/priceVolume')
  async salesPriceVolume(
    @Query('resolution') resolutionStr?: string,
  ): Promise<MetricEntity[]> {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSalesPriceVolume(params);
  }

  @Get('sales/nftCount')
  async salesNftCount(
    @Query('resolution') resolutionStr?: string,
  ): Promise<MetricEntity[]> {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSalesNftCount(params);
  }

  #queryParamsToMetricParams(resolutionStr?: string): MetricParams {
    const resolution = enumFromStringValue(Resolution, resolutionStr);
    if (typeof resolution === 'undefined') {
      throw new HttpException(
        'Bad resolution parameter',
        HttpStatus.BAD_REQUEST,
      );
    }
    return <MetricParams>{
      resolution: resolution || Resolution.Hour,
    };
  }
}
