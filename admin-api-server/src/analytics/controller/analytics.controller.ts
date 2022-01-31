import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  MetricEntity,
  MetricParams,
  Resolution,
} from '../../analytics/entity/analytics.entity';
import { AnalyticsService } from '../service/analytics.service';
import { enumFromStringValue } from 'src/utils';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/role/role.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('sales/priceVolume/snapshot')
  async salesPriceVolume(
    @Query('resolution') resolutionStr?: string,
  ): Promise<MetricEntity> {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSnapshotSalesPriceVolume(params);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('sales/nftCount/snapshot')
  async salesNftCount(
    @Query('resolution') resolutionStr?: string,
  ): Promise<MetricEntity> {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSnapshotSalesNftCount(params);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('sales/priceVolume/timeseries')
  async timeseriesSalesPriceVolume(
    @Query('resolution') resolutionStr?: string,
  ): Promise<{ data: MetricEntity[] }> {
    const params = this.#queryParamsToMetricParams(resolutionStr);

    if (params.resolution === Resolution.Infinite) {
      throw new HttpException(
        'Bad resolution parameter',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    return {
      data: await this.analyticsService.getTimeseriesSalesPriceVolume(params),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('sales/nftCount/timeseries')
  async timeseriesSalesNftCount(
    @Query('resolution') resolutionStr?: string,
  ): Promise<{ data: MetricEntity[] }> {
    const params = this.#queryParamsToMetricParams(resolutionStr);

    if (params.resolution === Resolution.Infinite) {
      throw new HttpException(
        'Bad resolution parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      data: await this.analyticsService.getTimeseriesSalesNftCount(params),
    };
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
