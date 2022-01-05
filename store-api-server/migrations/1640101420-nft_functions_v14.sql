-- Migration: nft_functions_v14
-- Created at: 2021-12-21 16:43:40
-- ====  UP  ====

BEGIN;

CREATE FUNCTION purchased_editions_pending_transfer(
  purchased_nft_id INTEGER, buyer_address TEXT, minter_address TEXT)
RETURNS INTEGER
AS $$
  SELECT
    COUNT(mtm) -
      COALESCE(SUM((mint.command->'args'->>'amount')::integer), 0)
      AS num_editions
  FROM kanvas_user AS usr
  JOIN mtm_kanvas_user_nft AS mtm
    ON  mtm.kanvas_user_id = usr.id
    AND mtm.nft_id = purchased_nft_id
  LEFT JOIN peppermint.operations mint
    ON  mint.command->>'handler' = 'nft'
    AND mint.command->>'name'::TEXT = 'transfer'
    AND (mint.command->'args'->'token_id')::INTEGER = mtm.nft_id
    AND mint.command->'args'->>'from_address' = minter_address
    AND mint.command->'args'->>'to_address' = buyer_address
    AND mint.state IN ('waiting', 'confirmed')
  WHERE usr.address = buyer_address
$$ LANGUAGE SQL;


-- Diff between previous and this version:
--   - bugfix regarding "pending"
ALTER FUNCTION nft_ids_filtered RENAME TO __nft_ids_filtered_v13;
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
                nft.launch_at <= now() AT TIME ZONE ' || quote_literal('UTC') || '
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
ALTER FUNCTION __nft_ids_filtered_v13 RENAME TO nft_ids_filtered;

DROP FUNCTION purchased_editions_pending_transfer(
  INTEGER, TEXT, TEXT);

COMMIT;
