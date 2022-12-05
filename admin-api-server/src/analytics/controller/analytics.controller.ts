import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import {
  MetricEntity,
  MetricParams,
  Resolution,
  Activity,
  Purchase,
  UserAnalytics,
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

class ConcordiaAnalyticsPagination {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  from_index?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  to_index?: number;
}

class UsersConcordiaAnalytics extends ConcordiaAnalyticsPagination {
  @IsString()
  @IsOptional()
  filter?: string;
}

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
   * @api {get} /analytics/users Request analytics user information regarding email signups.
   * @apiDescription Initially, users have not registered any email, for every user created there is an initial row in the response with email,marketing_consent,wallet_provider,etc, fields set to null. For every email registration (consecutive ones overwriting previously specified email addresses and marketing consent), an additional row will be present for this user to show the new email address and marketing consent value for this user.
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
   *             "email": null,
   *             "marketing_consent": null,
   *             "wallet_provider": null,
   *             "sso_id": null,
   *             "sso_type": null,
   *             "sso_email": null,
   *             "createdAt": "2022-11-21T10:59:01.741Z"
   *            },
   *            {
   *             "id": 2,
   *             "address": "any valid user address",
   *             "email": "max@muster.com",
   *             "marketing_consent": true,
   *             "wallet_provider": "temple",
   *             "sso_id": null,
   *             "sso_type": null,
   *             "sso_email": null,
   *             "created_at": "2022-11-21T11:59:01.741Z"
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
   * @apiDescription Result field "fee" is in base currency unit format. The base currency equals to the main currency of the store.
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
   *             "price": "10.00",
   *             "edition_size": 1,
   *             "currency": "EUR",
   *             "transaction_value": "5.00",
   *             "conversion_rate": "0.50",
   *             "purchaser_country": "GB"
   *            },
   *            {
   *             "id": 2,
   *             "timestamp": 1645717832,
   *             "kind": "transfer",
   *             "from": "q1w2e3r4t5z6u77i8o90p",
   *             "to": "1a2b3c4d5e6f7g8h9i10j",
   *             "tokenId": 8,
   *             "price": "25.00",
   *             "edition_size": 1,
   *             "currency": null,
   *             "transaction_value": null,
   *             "conversion_rate": null,
   *             "fee": 5.2300,
   *             "purchaser_country": "GB"
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
      'purchaser_country',
      'id',
      'timestamp',
      'kind',
      'from',
      'to',
      'tokenId',
      'price',
      'edition_size',
      'currency',
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

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @RolesDecorator(Roles.admin)
  @Get('purchases_concordia')
  async purchases(
    @Query() params: ConcordiaAnalyticsPagination,
  ): Promise<Purchase[]> {
    return await this.analyticsService.getPurchases(
      params.from_index,
      params.to_index,
    );
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @RolesDecorator(Roles.admin)
  @Get('users_concordia')
  async usersConcordiaAnalytics(
    @Query() params: UsersConcordiaAnalytics,
  ): Promise<UserAnalytics[]> {
    let filterOnHasPurchases: boolean | undefined;
    if (typeof params.filter !== 'undefined') {
      if (!['has_purchases', 'has_no_purchases'].includes(params.filter)) {
        throw new HttpException('invalid filter value', HttpStatus.BAD_REQUEST);
      }
      filterOnHasPurchases = params.filter === 'has_purchases';
    }
    return await this.analyticsService.getUsersConcordiaAnalytics(
      params.from_index,
      params.to_index,
      filterOnHasPurchases,
    );
  }
}
