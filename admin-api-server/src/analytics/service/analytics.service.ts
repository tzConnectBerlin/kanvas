import { Injectable, Inject } from '@nestjs/common';
import {
  Resolution,
  MetricEntity,
  MetricParams,
  Activity,
  MarketingEntity,
  Purchase,
  UserAnalytics,
} from '../entity/analytics.entity.js';
import { PG_CONNECTION_STORE_REPLICATION } from '../../constants.js';
import { ActivityFilterParams } from '../params.js';
import { BASE_CURRENCY, CurrencyService } from 'kanvas-api-lib';
import dayjs, { ManipulateType } from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { PaginationParams } from '../../utils';
dayjs.extend(utc);

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(PG_CONNECTION_STORE_REPLICATION) private storeRepl: any,
    private readonly currencyService: CurrencyService,
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
      value: Number(
        this.currencyService.convertToCurrency(
          Number(qryRes.rows[0]['price_volume'] || 0),
          BASE_CURRENCY,
        ),
      ),
    };
  }

  async getTimeseriesSalesNftCount(
    params: MetricParams,
  ): Promise<MetricEntity[]> {
    const qryRes = await this.#timeseries(params);

    const nftCountMap: Record<string, number> = {};
    qryRes.rows.forEach((row: any) => {
      const key = Math.floor(row['timestamp'].getTime() / 1000).toString();
      nftCountMap[key] = Number(row['nft_count']);
    });

    return this.zeroFillTimeseries(nftCountMap, params.resolution);
  }

  async getTimeseriesSalesPriceVolume(
    params: MetricParams,
  ): Promise<MetricEntity[]> {
    const qryRes = await this.#timeseries(params);

    const priceVolumeMap: Record<string, number> = {};
    qryRes.rows.forEach((row: any) => {
      const key = Math.floor(row['timestamp'].getTime() / 1000).toString();

      priceVolumeMap[key] = Number(
        this.currencyService.convertToCurrency(
          Number(row['price_volume']),
          BASE_CURRENCY,
        ),
      );
    });

    return this.zeroFillTimeseries(priceVolumeMap, params.resolution);
  }

  zeroFillTimeseries(
    timestampMap: Record<string, number>,
    resolution: Resolution,
  ): MetricEntity[] {
    const timestampKeys = Object.keys(timestampMap);
    let current = dayjs.unix(Number(timestampKeys.at(0))).toDate();
    const end = dayjs
      .unix(Number(timestampKeys.at(timestampKeys.length - 1)))
      .toDate();

    let manipulate: ManipulateType;
    switch (resolution) {
      case Resolution.Hour:
        manipulate = 'hour';
        break;
      case Resolution.Day:
        manipulate = 'day';
        break;
      case Resolution.Week:
        manipulate = 'week';
        break;
      case Resolution.Month:
        manipulate = 'month';
        break;
      default:
        manipulate = 'day';
    }

    while (current <= end) {
      const key = Math.floor(current.getTime() / 1000);
      timestampMap[key] ??= 0;
      current = dayjs(current).utc().add(1, manipulate).toDate();
    }

    return Object.entries(timestampMap).map(([key, value]) => {
      return { timestamp: Number(key), value };
    });
  }

  async getUsers(params: PaginationParams) {
    const qryRes = await this.storeRepl.query(
      `
SELECT
  usr.address AS address,
  marketing.email AS email,
  marketing.consent AS marketing_consent,
  usr.created_at AS created_at,
  COUNT(1) OVER () AS users_count,
  ROW_NUMBER() OVER (ORDER BY usr.created_at) AS id
FROM kanvas_user AS usr
  LEFT JOIN marketing
  ON marketing.address = usr.address
ORDER BY "${params.orderBy}" ${params.orderDirection}
OFFSET ${params.pageOffset}
LIMIT ${params.pageSize}`,
    );

    if (qryRes.rowCount === 0) {
      return { data: [], count: 0 };
    }

    return {
      data: qryRes.rows.map(
        (row: any) =>
          <MarketingEntity>{
            id: Number(row['id']),
            address: row['address'],
            email: row['email'],
            marketing_consent: row['marketing_consent'],
            createdAt: row['created_at'],
          },
      ),
      count: Number(qryRes.rows[0]['users_count']),
    };
  }

  async getActivities(
    params: ActivityFilterParams,
  ): Promise<{ data: Activity[]; count: number }> {
    const values = [
      params.filters?.kind,
      params.filters?.from,
      params.filters?.to,
      params.filters?.startDate,
      params.filters?.endDate,
    ];
    const qryRes = await this.storeRepl.query(
      `
SELECT
  *,
  COUNT(1) OVER () AS selected_activities_count
FROM (
  SELECT
    timestamp,
    kind,
    "from",
    "to",
    token_id AS "tokenId",
    price,
    edition_size,
    ROW_NUMBER() OVER (ORDER BY timestamp, kind, "from", "to", token_id) AS id,
    currency,
    nft_price_sum,
    nft_order_price,
    mutez_fee,
    purchaser_country
  FROM (
    SELECT
      lvl.baked_at AT TIME ZONE 'UTC' AS timestamp,
      'mint' AS kind,
      NULL AS "from",
      owner AS "to",
      mint_params.token_id,
      NULL::NUMERIC AS price,
      mint_params.amount AS edition_size,
      NULL::TEXT AS currency,
      NULL::NUMERIC AS nft_price_sum,
      NULL::NUMERIC AS nft_order_price,
      create_tx.fee + mint_tx.fee + (coalesce(create_tx.paid_storage_size_diff, 0) + coalesce(mint_tx.paid_storage_size_diff, 0)) * 250 AS mutez_fee,
      NULL::TEXT AS purchaser_country
    FROM onchain_kanvas."entry.mint_tokens.noname" AS mint_params
    JOIN que_pasa.tx_contexts AS ctx
      ON ctx.id = mint_params.tx_context_id
    JOIN que_pasa.levels AS lvl
      ON lvl.level = ctx.level
    JOIN que_pasa.txs AS mint_tx
      ON mint_tx.tx_context_id = mint_params.tx_context_id
    JOIN onchain_kanvas."entry.create_token" AS create_params
      ON create_params.token_id = mint_params.token_id
    JOIN que_pasa.txs AS create_tx
      ON create_tx.tx_context_id = create_params.tx_context_id


    UNION ALL

    SELECT
      lvl.baked_at AT TIME ZONE 'UTC' AS timestamp,
      'transfer' AS kind,
      tr_from.from_ AS "from",
      tr_dest.to_ AS "to",
      tr_dest.token_id,
      NULL::NUMERIC AS price,
      tr_dest.amount AS edition_size,
      NULL::TEXT AS currency,
      NULL::NUMERIC AS nft_price_sum,
      NULL::NUMERIC AS nft_order_price,
      transfer_tx.fee + coalesce(transfer_tx.paid_storage_size_diff, 0) * 250 AS mutez_fee,
      NULL::TEXT AS purchaser_country
    FROM onchain_kanvas."entry.transfer.noname" AS tr_from
    JOIN onchain_kanvas."entry.transfer.noname.txs" AS tr_dest
      ON tr_dest.noname_id = tr_from.id
    JOIN que_pasa.tx_contexts AS ctx
      ON ctx.id = tr_from.tx_context_id
    JOIN que_pasa.levels AS lvl
      ON lvl.level = ctx.level
    JOIN que_pasa.txs AS transfer_tx
      ON transfer_tx.tx_context_id = tr_dest.tx_context_id


    UNION ALL

    SELECT
      nft_order.order_at AS timestamp,
      'sale' AS kind,
      NULL AS "from",
      usr.address AS "to",
      nft.id AS token_id,
      nft.price,
      1 AS edition_size,
      payment.currency,
      (SELECT SUM(nft.price)
        FROM nft
        JOIN mtm_nft_order_nft AS mtm
          ON mtm.nft_order_id = nft_order.id
          AND nft.id = mtm.nft_id
      ) AS nft_price_sum,
      amount AS nft_order_price,
      NULL::NUMERIC AS mutez_fee,
      payment.purchaser_country
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
) q2
WHERE ($1::TEXT[] IS NULL OR kind = ANY($1::TEXT[]))
  AND ($2::TEXT[] IS NULL OR "from" = ANY($2::TEXT[]))
  AND ($3::TEXT[] IS NULL OR "to" = ANY($3::TEXT[]))
  AND ($4::TIMESTAMP IS NULL OR $5::TIMESTAMP IS NULL OR q2.timestamp BETWEEN $4 AND $5)
ORDER BY "${params.orderBy}" ${params.orderDirection}
OFFSET ${params.pageOffset}
LIMIT ${params.pageSize}
`,
      values,
    );

    if (qryRes.rowCount === 0) {
      return { data: [], count: 0 };
    }

    return {
      data: await Promise.all(
        qryRes.rows.map(async (row: any) => {
          const price = this.currencyService.convertToCurrency(
            Number(row['price']),
            BASE_CURRENCY,
          );
          const historicRates = await this.currencyService.ratesAt(
            row['timestamp'],
          );
          const feeInBaseCurrency: number =
            this.currencyService.convertFromCurrency(
              Number(row['mutez_fee']) / 1000000,
              'XTZ',
              historicRates,
              false,
            );
          const nftPriceSumBase = this.currencyService.convertToCurrency(
            row['nft_price_sum'],
            BASE_CURRENCY,
          );
          const conversionRate =
            row['nft_order_price'] &&
            Number(nftPriceSumBase) / row['nft_order_price'];

          return <Activity>{
            id: Number(row['id']),
            timestamp: Math.floor(row['timestamp'].getTime() / 1000),
            kind: row['kind'],
            from: row['from'],
            to: row['to'],
            tokenId: Number(row['tokenId']),
            price,
            edition_size: Number(row['edition_size']),
            currency: row['currency'],
            transaction_value:
              price &&
              conversionRate &&
              (Number(price) / conversionRate).toFixed(2),
            conversion_rate: conversionRate && conversionRate.toFixed(2),
            purchaser_country: row['purchaser_country'],
            fee:
              feeInBaseCurrency > 0
                ? this.currencyService.convertFromBaseUnit(
                    BASE_CURRENCY,
                    feeInBaseCurrency,
                  )
                : null,
          };
        }),
      ),
      count: Number(qryRes.rows[0]['selected_activities_count']),
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

  async getPurchases(
    fromIndex?: number,
    toIndex?: number,
  ): Promise<Purchase[]> {
    const qryRes = await this.storeRepl.query(
      `
SELECT DISTINCT ON (q.index)
  q.*,
  last_value(marketing.email) OVER w AS email,
  last_value(marketing.consent) OVER w AS marketing_consent,
  last_value(wallet_provider) OVER w AS wallet_provider,
  last_value(sso_id) OVER w AS sso_id,
  last_value(sso_type) OVER w AS sso_type,
  last_value(sso_email) OVER w AS sso_email
FROM
(
  SELECT
    ROW_NUMBER() OVER (ORDER BY nft_order.order_at, token_id) AS index,

    usr.address,

    nft_order.order_at AS timestamp,
    (SELECT SUM(nft.price)
      FROM nft
      JOIN mtm_nft_order_nft AS mtm
        ON mtm.nft_order_id = nft_order.id
        AND nft.id = mtm.nft_id
    ) AS order_price,
    delivery.transfer_nft_id AS token_id,
    nft.price,
    1 AS edition_size,

    payment.currency AS transaction_currency,
    payment.amount AS order_transaction_value,

    payment.purchaser_country,
    payment.vat_rate,

    transfer_tx.fee + coalesce(transfer_tx.paid_storage_size_diff, 0) * 250 AS transfer_mutez_fee,
    CASE
      WHEN (
        SELECT
          min(id) = peppermint_op.id
        FROM peppermint.operations
        WHERE command->>'name' = 'transfer'
          AND (command->'args'->>'token_id')::int = delivery.transfer_nft_id
          AND state = 'confirmed') = true
      THEN (
        SELECT
          create_tx.fee + mint_tx.fee + (coalesce(create_tx.paid_storage_size_diff, 0) + coalesce(mint_tx.paid_storage_size_diff, 0)) * 250 AS mutez_fee
        FROM onchain_kanvas."entry.mint_tokens.noname" AS mint_params
        JOIN que_pasa.txs AS mint_tx
          ON mint_tx.tx_context_id = mint_params.tx_context_id
        JOIN onchain_kanvas."entry.create_token" AS create_params
          ON create_params.token_id = mint_params.token_id
        JOIN que_pasa.txs AS create_tx
          ON create_tx.tx_context_id = create_params.tx_context_id
        WHERE mint_params.token_id = delivery.transfer_nft_id
      )
      ELSE 0
    END AS mint_mutez_fee
  FROM payment
  JOIN nft_order
    ON nft_order.id = payment.nft_order_id
  JOIN kanvas_user AS usr
    ON usr.id = nft_order.user_id
  JOIN nft_order_delivery AS delivery
    ON delivery.nft_order_id = nft_order.id
  JOIN nft
    ON nft.id = delivery.transfer_nft_id

  JOIN peppermint.operations AS peppermint_op
    ON peppermint_op.id = delivery.transfer_operation_id
  JOIN onchain_kanvas."entry.transfer.noname.txs" AS tr_dest
    ON  tr_dest.token_id = delivery.transfer_nft_id
    AND tr_dest.to_ = usr.address
  JOIN que_pasa.txs AS transfer_tx
    ON  transfer_tx.tx_context_id = tr_dest.tx_context_id
    AND transfer_tx.operation_hash = peppermint_op.included_in

  WHERE payment.status = 'succeeded'
) q
LEFT JOIN marketing
  ON marketing.address = q.address

WHERE ($1::int IS NULL OR index >= $1)
  AND ($2::int IS NULL OR index <= $2)

WINDOW w AS (
  PARTITION BY q.index
  ORDER BY marketing.created_at
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)

ORDER BY index
      `,
      [fromIndex, toIndex],
    );
    return await Promise.all(
      qryRes.rows.map(async (row: any): Promise<Purchase> => {
        const price = this.currencyService.convertFromBaseUnit(
          BASE_CURRENCY,
          row['price'],
        );

        const nftPriceSumBase = this.currencyService.convertToCurrency(
          row['order_price'],
          BASE_CURRENCY,
        );
        const conversionRate =
          row['order_transaction_value'] &&
          Number(nftPriceSumBase) / row['order_transaction_value'];

        const feeXTZ =
          (Number(row['transfer_mutez_fee']) + Number(row['mint_mutez_fee'])) /
          1000000;
        const historicRates = await this.currencyService.ratesAt(
          row['timestamp'],
        );
        const feeInBaseCurrency = this.currencyService.convertFromCurrency(
          feeXTZ,
          'XTZ',
          historicRates,
          false,
        );

        return {
          index: Number(row['index']),

          wallet_address: row['address'],
          email: row['email'] != null ? row['email'] : undefined,
          marketing_consent:
            row['email'] != null ? row['marketing_consent'] : undefined,
          age_verification: row['email'] != null ? true : false,

          wallet_provider: row['wallet_provider'] != null ? row['wallet_provider'] : undefined,
          sso_id: row['sso_id'] != null ? row['sso_id'] : undefined,
          sso_type: row['sso_type'] != null ? row['sso_type'] : undefined,
          sso_email: row['sso_email'] != null ? row['sso_email'] : undefined,

          token_collection: 'concordia',
          token_id: row['token_id'],
          token_value: price,
          token_purchased_at: row['timestamp'],

          transaction_currency: row['transaction_currency'],

          transaction_value:
            price &&
            conversionRate &&
            Number((price / conversionRate).toFixed(2)),
          conversion_rate: conversionRate && Number(conversionRate.toFixed(2)),

          vat_rate: row['vat_rate'],
          purchaser_country: row['purchaser_country'],

          gas_fees: this.currencyService.convertFromBaseUnit(
            BASE_CURRENCY,
            feeInBaseCurrency,
          ),
        };
      }),
    );
  }

  async getUsersConcordiaAnalytics(
    fromIndex?: number,
    toIndex?: number,
    filterOnHasPurchases?: boolean,
  ): Promise<UserAnalytics[]> {
    const qryRes = await this.storeRepl.query(
      `
SELECT DISTINCT ON (index)
  q.*,
  last_value(marketing.email) OVER w AS email,
  last_value(consent) OVER w AS marketing_consent,
  last_value(wallet_provider) OVER w AS wallet_provider,
  last_value(sso_id) OVER w AS sso_id,
  last_value(sso_type) OVER w AS sso_type,
  last_value(sso_email) OVER w AS sso_email
FROM (
  SELECT
    ROW_NUMBER() OVER (ORDER BY q.id) AS index,
    q.*
  FROM (
    SELECT
      usr.id,
      usr.address,
      usr.created_at,
      EXISTS (SELECT 1 FROM mtm_kanvas_user_nft WHERE kanvas_user_id = usr.id LIMIT 1) AS has_purchases
    FROM kanvas_user AS usr
  ) q
  WHERE ($3::bool IS NULL OR has_purchases = $3)
) q
LEFT JOIN marketing
  ON marketing.address = q.address

WHERE ($1::int IS NULL OR q.index >= $1)
  AND ($2::int IS NULL OR q.index <= $2)

WINDOW w AS (
  PARTITION BY q.index
  ORDER BY marketing.created_at
  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)

ORDER BY index
      `,
      [fromIndex, toIndex, filterOnHasPurchases],
    );

    return qryRes.rows.map((row: any): UserAnalytics => {
      return {
        index: Number(row['index']),
        wallet_address: row['address'],
        registered_at: row['created_at'],

        email: row['email'] != null ? row['email'] : undefined,
        marketing_consent:
          row['email'] != null ? row['marketing_consent'] : undefined,
        age_verification: row['email'] != null ? true : false,

        wallet_provider: row['wallet_provider'] != null ? row['wallet_provider'] : undefined,
        sso_id: row['sso_id'] != null ? row['sso_id'] : undefined,
        sso_type: row['sso_type'] != null ? row['sso_type'] : undefined,
        sso_email: row['sso_email'] != null ? row['sso_email'] : undefined,

        has_purchases: row['has_purchases'],
      };
    });
  }
}
