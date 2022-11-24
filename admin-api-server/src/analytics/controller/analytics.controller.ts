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

  /**
   * @apiGroup Analytics
   * @apiPermission admin
   * @api {get} /analytics/sales/priceVolume/snapshot Request price volume snapshot
   * @apiQuery {String="hour","day","week","month"} [resolution]
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/analytics/sales/priceVolume/snapshot?resolution=week
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *      "timestamp": 1668513332,
   *       "value": 86
   *    }
   * @apiName salesPriceVolume
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/priceVolume/snapshot')
  async salesPriceVolume(
    @Query('resolution') resolutionStr?: keyof Record<Resolution, string>,
  ) {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSnapshotSalesPriceVolume(params);
  }

  /**
   * @apiGroup Analytics
   * @api {get} /analytics/sales/nftCount/snapshot Request nft count snapshot
   * @apiPermission admin
   * @apiQuery {String="hour","day","week","month"} [resolution]
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/analytics/sales/nftCount/snapshot?resolution=month
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *      "timestamp": 1668513332,
   *       "value": 86
   *    }
   * @apiName salesNftCount
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/nftCount/snapshot')
  async salesNftCount(
    @Query('resolution') resolutionStr?: keyof Record<Resolution, string>,
  ) {
    const params = this.#queryParamsToMetricParams(resolutionStr);
    return await this.analyticsService.getSnapshotSalesNftCount(params);
  }

  /**
   * @apiGroup Analytics
   * @api {get} /analytics/sales/priceVolume/timeseries Request the price volume timeseries timestamps
   * @apiPermission admin
   * @apiQuery {String="hour","day","week","month"} [resolution]
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/analytics/sales/priceVolume/timeseries?resolution=day
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *        "data": [
   *            {
   *              "timestamp": 1645660800,
   *              "value": 29999.97
   *            },
   *            {
   *              "timestamp": 1645747200,
   *              "value": 1.96
   *            }
   *            ...
   *        ]
   *    }
   * @apiName timeseriesSalesPriceVolume
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/priceVolume/timeseries')
  async timeseriesSalesPriceVolume(
    @Query('resolution') resolutionStr?: keyof Record<Resolution, string>,
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

  /**
   * @apiGroup Analytics
   * @api {get} /analytics/sales/nftCount/timeseries Request the nft count timeseries timestamps
   * @apiPermission admin
   * @apiQuery {String="hour","day","week","month"} [resolution]
   * @apiExample {http} Example http request url (make sure to replace $base_url with the admin-api-server endpoint):
   *  $base_url/analytics/sales/nftCount/timeseries?resolution=day
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *        "data": [
   *            {
   *              "timestamp": 1645660800,
   *              "value": 3
   *            },
   *            {
   *              "timestamp": 1645747200,
   *              "value": 2
   *            }
   *            ...
   *        ]
   *    }
   * @apiName timeseriesSalesNftCount
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('sales/nftCount/timeseries')
  async timeseriesSalesNftCount(
    @Query('resolution') resolutionStr?: keyof Record<Resolution, string>,
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

  /**
   * @apiGroup Analytics
   * @api {get} /analytics/users Request analytics user information regarding email signups
   * @apiPermission admin
   * @apiQuery {String[]="id","address","email","consent"} [sort] URL-decoded examples: sort: [$value,"desc"] or sort: [$value,"asc"]
   * @apiQuery {Number[]="[number, number] e.g. [10, 25]"} [range] URL-decoded example: range: [10, 25] results in 25 records from the 10th record on
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *    "count": 2,
   *        "data": [
   *            {
   *             "id": 1,
   *             "address": "any valid user address",
   *             "email": "maxime@muster.com",
   *             "marketing_consent": true,
   *             "createdAt": "2022-11-21T10:59:01.741Z"
   *            },
   *            {
   *             "id": 2,
   *             "address": "any valid user address",
   *             "email": "max@muster.com",
   *             "marketing_consent": false,
   *             "createdAt": "2022-11-21T10:59:01.741Z"
   *            }
   *        ]
   *    }
   * @apiName users
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.admin)
  @Get('users')
  async users(
    @Query('sort', new ParseJSONPipe()) sort?: [string, 'asc' | 'desc'],
    @Query('range', new ParseJSONPipe()) range?: number[],
  ) {
    const params = queryParamsToPaginationParams(sort, range);

    validatePaginationParams(params, [
      'id',
      'address',
      'email',
      'marketing_consent',
    ]);

    return await this.analyticsService.getUsers(params);
  }

  /**
   * @apiGroup Analytics
   * @api {get} /analytics/activities Request the analytics activity information
   * @apiPermission admin
   * @apiQuery {Object="from: string[]","to: string[]","kind: string[]","startDate: string","endDate: string"} [filters] URL-decoded example: filters: { "startDate": "1970-01-20T07:28:39.307Z", "endDate": "1970-05-20T07:28:39.307Z" }
   * @apiQuery {String[]="timestamp","id","kind","amount","token","from","to"} [sort] URL-decoded examples: sort: [$value,"desc"] or sort: [$value,"asc"]
   * @apiQuery {Number[]="[number, number] e.g. [10, 25]"} [range] URL-decoded example: range: [10, 25] results in 25 records from the 10th record on
   *
   * @apiSuccessExample Example Success-Response:
   *    {
   *        "data": [
   *            {
   *             "id": 1,
   *             "timestamp": 1645717412,
   *             "kind": "sale",
   *             "from": null,
   *             "to": "1a2b3c4d5e6f7g8h9i10j",
   *             "tokenId": 8,
   *             "price": "9999.99",
   *             "amount": 1
   *            },
   *            {
   *             "id": 2,
   *             "timestamp": 1645717832,
   *             "kind": "sale",
   *             "from": null,
   *             "to": "1a2b3c4d5e6f7g8h9i10j",
   *             "tokenId": 8,
   *             "price": "9999.99",
   *             "amount": 1
   *            }
   *            ...,
   *            "count": 75
   *        ]
   *    }
   * @apiName activities
   */
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

  #queryParamsToMetricParams(
    resolutionStr?: keyof Record<Resolution, string>,
  ): MetricParams {
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

  #parseResolution(
    resolutionStr?: keyof Record<Resolution, string>,
  ): Resolution | undefined {
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
