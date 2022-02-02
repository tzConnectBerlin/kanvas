import {
  Logger,
  HttpStatus,
  HttpException,
  Injectable,
  Inject,
} from '@nestjs/common';
import {
  Resolution,
  MetricEntity,
  MetricParams,
} from '../entity/analytics.entity';
import { PG_CONNECTION_STORE_REPLICATION } from '../../constants';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(PG_CONNECTION_STORE_REPLICATION) private storeRepl: any,
  ) {}

  async getSnapshotSalesNftCount(params: MetricParams): Promise<MetricEntity> {
    const qryRes = await this.#snapshot(params);

    return <MetricEntity>{
      timestamp: Math.floor(qryRes.rows[0]['timestamp'].getTime() / 1000),
      value: Number(qryRes.rows[0]['nft_count']),
    };
  }

  async getSnapshotSalesPriceVolume(
    params: MetricParams,
  ): Promise<MetricEntity> {
    const qryRes = await this.#snapshot(params);

    return <MetricEntity>{
      timestamp: Math.floor(qryRes.rows[0]['timestamp'].getTime() / 1000),
      value: qryRes.rows[0]['price_volume'] || 0,
    };
  }

  async getTimeseriesSalesNftCount(
    params: MetricParams,
  ): Promise<MetricEntity[]> {
    const qryRes = await this.#timeseries(params);

    return qryRes.rows.map(
      (row: any) =>
        <MetricEntity>{
          timestamp: Math.floor(row['timestamp'].getTime() / 1000),
          value: Number(row['nft_count']),
        },
    );
  }

  async getTimeseriesSalesPriceVolume(
    params: MetricParams,
  ): Promise<MetricEntity[]> {
    const qryRes = await this.#timeseries(params);

    return qryRes.rows.map(
      (row: any) =>
        <MetricEntity>{
          timestamp: Math.floor(row['timestamp'].getTime() / 1000),
          value: row['price_volume'],
        },
    );
  }

  async #timeseries(params: MetricParams) {
    return await this.storeRepl.query(
      `
SELECT
  date_trunc($1, nft_order.order_at) AS timestamp,
  SUM(nft.price) AS price_volume,
  COUNT(1) AS nft_count
FROM payment
JOIN nft_order
  ON nft_order.id = payment.nft_order_id
JOIN mtm_nft_order_nft AS mtm
  ON mtm.nft_order_id = nft_order.id
JOIN nft
  ON nft.id = mtm.nft_id
WHERE payment.status = 'succeeded'
GROUP BY timestamp
ORDER BY timestamp
      `,
      [params.resolution],
    );
  }

  async #snapshot(params: MetricParams) {
    let intervalSeconds: number;
    switch (params.resolution) {
      case Resolution.Hour:
        intervalSeconds = 60 * 60;
        break;
      case Resolution.Day:
        intervalSeconds = 60 * 60 * 24;
        break;
      case Resolution.Week:
        intervalSeconds = 60 * 60 * 24 * 7;
        break;
      case Resolution.Month:
        intervalSeconds = 60 * 60 * 24 * 30;
        break;
      case Resolution.Infinite:
        intervalSeconds = Math.floor(new Date().getTime() / 1000);
        break;
    }

    return await this.storeRepl.query(
      `
SELECT
  now() AT TIME ZONE 'UTC' AS timestamp,
  SUM(nft.price) AS price_volume,
  COUNT(1) AS nft_count
FROM payment
JOIN nft_order
  ON nft_order.id = payment.nft_order_id
JOIN mtm_nft_order_nft AS mtm
  ON mtm.nft_order_id = nft_order.id
JOIN nft
  ON nft.id = mtm.nft_id
WHERE payment.status = 'succeeded'
  AND nft_order.order_at >= now() - (interval '1' second)*$1
      `,
      [intervalSeconds],
    );
  }
}
