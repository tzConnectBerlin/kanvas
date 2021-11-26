-- Migration: nft_functions_v6
-- Created at: 2021-11-25 17:57:17
-- ====  UP  ====

BEGIN;

-- Diff between previous and this version:
--   Added priceAtLeast and priceAtMost filters
ALTER FUNCTION nft_ids_filtered RENAME TO __nft_ids_filtered_v5;
CREATE FUNCTION nft_ids_filtered(
    address TEXT, categories INTEGER[],
    priceAtLeast NUMERIC, priceAtMost NUMERIC,
    orderBy TEXT, orderDirection TEXT,
    "offset" INTEGER, "limit" INTEGER,
    untilNftLastUpdated TIMESTAMP WITHOUT TIME ZONE)
  RETURNS TABLE(nft_id nft.id%TYPE, total_nft_count bigint, lower_price_bound NUMERIC, upper_price_bound NUMERIC)
AS $$
BEGIN
  IF orderDirection NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nfts_filtered(): invalid orderDirection';
  END IF;
  RETURN QUERY EXECUTE '
    SELECT
      nft.id as nft_id,
      COUNT(1) OVER () AS total_nft_count,
      MIN(price) OVER () as lower_price_bound,
      MAX(price) OVER () as upper_price_bound
    FROM nft
    JOIN mtm_nft_category
      ON mtm_nft_category.nft_id = nft.id
    LEFT JOIN mtm_kanvas_user_nft
      ON mtm_kanvas_user_nft.nft_id = nft.id
    LEFT JOIN kanvas_user
      ON mtm_kanvas_user_nft.kanvas_user_id = kanvas_user.id
    WHERE ($1 IS NULL OR nft.updated_at <= $1)
      AND ($2 IS NULL OR kanvas_user.address = $2)
      AND ($3 IS NULL OR nft_category_id = ANY($3))
      AND ($4 IS NULL OR nft.price >= $4)
      AND ($5 IS NULL OR nft.price <= $5)
    GROUP BY nft.id
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection || '
    OFFSET $6
    LIMIT  $7'
    USING untilNftLastUpdated, address, categories, priceAtLeast, priceAtMost, "offset", "limit";
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nft_ids_filtered(
    TEXT, INTEGER[],
    NUMERIC, NUMERIC,
    TEXT, TEXT,
    INTEGER, INTEGER,
    TIMESTAMP WITHOUT TIME ZONE);
ALTER FUNCTION __nft_ids_filtered_v5 RENAME TO nft_ids_filtered;

COMMIT;
