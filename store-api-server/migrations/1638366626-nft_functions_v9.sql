-- Migration: nft_functions_v9
-- Created at: 2021-12-01 14:50:26
-- ====  UP  ====

BEGIN;

-- Diff between previous and this version:
--   additional filter on availability (can be: soldOut, onSale, upcoming)
ALTER FUNCTION nft_ids_filtered RENAME TO __nft_ids_filtered_v9;
CREATE FUNCTION nft_ids_filtered(
    address TEXT, categories INTEGER[],
    price_at_least NUMERIC, price_at_most NUMERIC,
    availability TEXT,
    order_by TEXT, order_direction TEXT,
    "offset" INTEGER, "limit" INTEGER,
    until TIMESTAMP WITHOUT TIME ZONE)
  RETURNS TABLE(nft_id nft.id%TYPE, total_nft_count bigint)
AS $$
BEGIN
  IF order_direction NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nft_ids_filtered(): invalid order_direction';
  END IF;
  RETURN QUERY EXECUTE '
    SELECT
      nft.id as nft_id,
      COUNT(1) OVER () AS total_nft_count
    FROM nft
    JOIN mtm_nft_category
      ON mtm_nft_category.nft_id = nft.id
    LEFT JOIN mtm_kanvas_user_nft
      ON mtm_kanvas_user_nft.nft_id = nft.id
    LEFT JOIN kanvas_user
      ON mtm_kanvas_user_nft.kanvas_user_id = kanvas_user.id
    WHERE ($1 IS NULL OR nft.created_at <= $1)
      AND ($2 IS NULL OR kanvas_user.address = $2)
      AND ($3 IS NULL OR nft_category_id = ANY($3))
      AND ($4 IS NULL OR nft.price >= $4)
      AND ($5 IS NULL OR nft.price <= $5)
      AND ($6 IS NULL OR (
        CASE
          WHEN $6 = ' || quote_literal('onSale') || '
            THEN nft.launch_at <= now() AT TIME ZONE ' || quote_literal('UTC') || '
             AND (
                SELECT reserved + owned FROM nft_editions_locked(nft.id)
             ) < nft.editions_size
          WHEN $6 = ' || quote_literal('soldOut') || '
            THEN (
                SELECT reserved + owned FROM nft_editions_locked(nft.id)
            ) >= nft.editions_size
          WHEN $6 = ' || quote_literal('upcoming') || '
            THEN nft.launch_at > now() AT TIME ZONE ' || quote_literal('UTC') || '
          ELSE false
        END
      ))
    GROUP BY nft.id
    ORDER BY ' || quote_ident(order_by) || ' ' || order_direction || '
    OFFSET $7
    LIMIT  $8'
    USING until, address, categories, price_at_least, price_at_most, availability, "offset", "limit";
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

COMMIT;
