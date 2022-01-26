import {
  Logger,
  HttpStatus,
  HttpException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { MetricEntity, MetricParams } from '../entity/analytics.entity';
import { PG_CONNECTION_STORE_REPLICATION } from '../../constants';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(PG_CONNECTION_STORE_REPLICATION) private storeRepl: any,
  ) {}

  async getSalesNftCount(params: MetricParams): Promise<MetricEntity[]> {
    const qryRes = await this.#timeseries(params);

    return qryRes.rows.map(
      (row: any) =>
        <MetricEntity>{
          timestamp: Math.floor(row['timestamp'].getTime() / 1000),
          value: row['nft_count'],
        },
    );
  }

  async getSalesPriceVolume(params: MetricParams): Promise<MetricEntity[]> {
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
}
