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
  Activity,
} from '../entity/analytics.entity.js';
import { ParseJSONPipe } from '../../pipes/ParseJSONPipe.js';
import { ParseJSONObjectPipe } from '../../pipes/ParseJSONObjectPipe.js';
import { AnalyticsService } from '../service/analytics.service.js';
import { enumFromStringValue } from '../../utils.js';
import { RolesDecorator } from '../../role/role.decorator.js';
import { Roles } from '../../role/entities/role.entity.js';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard.js';
import { RolesGuard } from '../../role/role.guard.js';
import { ActivityFilterParams, ActivityFilters } from '../params.js';
import {
  queryParamsToPaginationParams,
  validatePaginationParams,
} from '../../utils.js';

@Controller('analytics')
export class AnalyticsController {
  defaultResolution = Resolution.Day;

  constructor(private analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/priceVolume/snapshot')
  async salesPriceVolume(@Query('resolution') resolutionStr?: string) {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSnapshotSalesPriceVolume(params);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/nftCount/snapshot')
  async salesNftCount(@Query('resolution') resolutionStr?: string) {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSnapshotSalesNftCount(params);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
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
  @RolesDecorator(Roles.admin)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('activities')
  async activities(
    @Query('filters', new ParseJSONObjectPipe()) filters: ActivityFilters,
    @Query('sort', new ParseJSONPipe()) sort?: [string, 'asc' | 'desc'],
    @Query('range', new ParseJSONPipe()) range?: number[],
  ): Promise<{ data: Activity[]; count: number }> {
    const params = this.#queryParamsToFilterParams(filters, sort, range);

    validatePaginationParams(params, [
      'id',
      'timestamp',
      'kind',
      'from',
      'to',
      'tokenId',
      'price',
      'amount',
    ]);
    return await this.analyticsService.getActivities(params);
  }

  #queryParamsToMetricParams(resolutionStr?: string): MetricParams {
    const resolution = this.#parseResolution(resolutionStr);
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

  #parseResolution(resolutionStr?: string): Resolution | undefined {
    if (typeof resolutionStr === 'undefined') {
      return this.defaultResolution;
    }
    return enumFromStringValue(Resolution, resolutionStr);
  }

  #queryParamsToFilterParams(
    filters: ActivityFilters,
    sort?: string[],
    range?: number[],
  ) {
    return {
      ...new ActivityFilterParams(),
      ...queryParamsToPaginationParams(sort, range),
      filters: filters,
    };
  }
}
