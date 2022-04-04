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
  Activity,
} from '../entity/analytics.entity';
import { PG_CONNECTION_STORE_REPLICATION } from '../../constants';
import { ActivityFilterParams } from '../params';

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
      value: Number(qryRes.rows[0]['price_volume']) || 0,
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
          value: Number(row['price_volume']),
        },
    );
  }

  async getActivities(
    params: ActivityFilterParams,
  ): Promise<{ data: Activity[]; count: number }> {
    const qryRes = await this.storeRepl.query(
      `
SELECT
  timestamp,
  kind,
  "from",
  "to",
  token_id AS "tokenId",
  price,
  amount,
  COUNT(1) OVER () AS total_activity_count
FROM (
  SELECT
    lvl.baked_at AS timestamp,
    'mint' AS kind,
    NULL AS "from",
    owner AS "to",
    mint.token_id,
    NULL::NUMERIC AS price,
    mint.amount
  FROM onchain_kanvas."entry.mint_tokens.noname" AS mint
  JOIN que_pasa.tx_contexts AS ctx
    ON ctx.id = mint.tx_context_id
  JOIN que_pasa.levels AS lvl
    ON lvl.level = ctx.level

  UNION ALL

  SELECT
    lvl.baked_at AS timestamp,
    'transfer' AS kind,
    tr_from.from_ AS "from",
    tr_dest.to_ AS "to",
    tr_dest.token_id,
    NULL::NUMERIC AS price,
    tr_dest.amount
  FROM onchain_kanvas."entry.transfer.noname" AS tr_from
  JOIN onchain_kanvas."entry.transfer.noname.txs" AS tr_dest
    ON tr_dest.noname_id = tr_from.id
  JOIN que_pasa.tx_contexts AS ctx
    ON ctx.id = tr_from.tx_context_id
  JOIN que_pasa.levels AS lvl
    ON lvl.level = ctx.level

  UNION ALL

  SELECT
    nft_order.order_at AS timestamp,
    'sale' AS kind,
    NULL AS "from",
    usr.address AS "to",
    nft.id AS token_id,
    nft.price,
    1 AS amount
  FROM payment
  JOIN nft_order
    ON nft_order.id = payment.nft_order_id
  JOIN mtm_nft_order_nft AS mtm
    ON mtm.nft_order_id = nft_order.id
  JOIN nft
    ON nft.id = mtm.nft_id
  JOIN kanvas_user AS usr
    ON usr.id = nft_order.user_id
  WHERE payment.status = 'succeeded'
) q
WHERE ($1::TEXT[] IS NULL OR kind = ANY($1::TEXT[]))
  AND ($2::TEXT[] IS NULL OR "from" = ANY($2::TEXT[]))
  AND ($3::TEXT[] IS NULL OR "to" = ANY($3::TEXT[]))
ORDER BY "${params.orderBy}" ${params.orderDirection}
OFFSET ${params.pageOffset}
LIMIT ${params.pageSize}
`,
      [params.filters.kind, params.filters.from, params.filters.to],
    );

    if (qryRes.rowCount === 0) {
      return { data: [], count: 0 };
    }

    return {
      data: qryRes.rows.map(
        (row: any) =>
          <Activity>{
            timestamp: Math.floor(row['timestamp'].getTime() / 1000),
            kind: row['kind'],
            from: row['from'],
            to: row['to'],
            tokenId: Number(row['tokenId']),
            price: Number(row['price']),
            amount: Number(row['amount']),
          },
      ),
      count: Number(qryRes.rows[0]['total_activity_count']),
    };
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
