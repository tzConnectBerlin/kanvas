-- Migration: nft_ids_filtered_v2.sql
-- Created at: 2022-04-04 21:03:21
-- ====  UP  ====

BEGIN;

ALTER FUNCTION nft_ids_filtered RENAME TO __nfts_ids_filtered_v1;
CREATE FUNCTION nft_ids_filtered(
    address TEXT, categories INTEGER[],
    price_at_least NUMERIC, price_at_most NUMERIC,
    availability TEXT[],
    order_by TEXT, order_direction TEXT,
    "offset" INTEGER, "limit" INTEGER,
    until TIMESTAMP WITHOUT TIME ZONE,
    minter_address TEXT)
  RETURNS TABLE(nft_id nft.id%TYPE, total_nft_count bigint)
AS $$
BEGIN
  IF order_direction NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nft_ids_filtered(): invalid order_direction';
  END IF;
  IF NOT (availability <@ '{soldOut, onSale, upcoming}'::text[]) THEN
    RAISE EXCEPTION 'nft_ids_filtered(): invalid availability';
  END IF;
  RETURN QUERY EXECUTE '
    SELECT
      nft_id,
      total_nft_count
    FROM (
      SELECT
        nft.id as nft_id,
        nft.created_at as nft_created_at,
        COUNT(1) OVER () AS total_nft_count
      FROM nft
      JOIN mtm_nft_category
        ON mtm_nft_category.nft_id = nft.id
      LEFT JOIN mtm_kanvas_user_nft
        ON mtm_kanvas_user_nft.nft_id = nft.id
      LEFT JOIN kanvas_user
        ON mtm_kanvas_user_nft.kanvas_user_id = kanvas_user.id
      WHERE ($1 IS NULL OR nft.created_at <= $1)
        AND ($2 IS NULL OR (
              EXISTS (
                SELECT 1
                FROM onchain_kanvas."storage.ledger_live"
                WHERE idx_assets_address = $2
                  AND idx_assets_nat = nft.id
              ) OR (
                purchased_editions_pending_transfer(nft.id, $2, $9) > 0
              )
            ))
        AND ($3 IS NULL OR nft_category_id = ANY($3))
        AND ($4 IS NULL OR nft.price >= $4)
        AND ($5 IS NULL OR nft.price <= $5)
        AND ($6 IS NULL OR (
              (' || quote_literal('onSale') || ' = ANY($6) AND (
                nft.launch_at IS NULL OR nft.launch_at <= now() AT TIME ZONE ' || quote_literal('UTC') || '
                AND (
                   SELECT reserved + owned FROM nft_editions_locked(nft.id)
                ) < nft.editions_size
              )) OR
              (' || quote_literal('soldOut') || ' = ANY($6) AND (
                (
                  SELECT reserved + owned FROM nft_editions_locked(nft.id)
                ) >= nft.editions_size
              )) OR
              (' || quote_literal('upcoming') || ' = ANY($6) AND (
                nft.launch_at > now() AT TIME ZONE ' || quote_literal('UTC') || '
              ))
            ))
      GROUP BY nft.id, nft.created_at
      ORDER BY ' || quote_ident(order_by) || ' ' || order_direction || '
      OFFSET $7
      LIMIT  $8
    ) q'
    USING until, address, categories, price_at_least, price_at_most, availability, "offset", "limit", minter_address;
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nft_ids_filtered(
  TEXT, INTEGER[],
  NUMERIC, NUMERIC,
  TEXT[],
  TEXT, TEXT,
  INTEGER, INTEGER,
  TIMESTAMP WITHOUT TIME ZONE,
  TEXT);
ALTER FUNCTION __nfts_ids_filtered_v1 RENAME TO nft_ids_filtered;

COMMIT;

