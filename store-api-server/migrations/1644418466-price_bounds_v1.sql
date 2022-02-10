-- Migration: price_bounds_v1
-- Created at: 2022-02-09 15:54:26
-- ====  UP  ====

BEGIN;

CREATE FUNCTION price_bounds(
  address_filter TEXT, categories_filter INTEGER[],
  until_filter TIMESTAMP WITHOUT TIME ZONE)
RETURNS TABLE(min_price NUMERIC, max_price NUMERIC)
AS $$
  SELECT
    MIN(price) as min_price,
    MAX(price) as max_price
  FROM nft
  JOIN mtm_nft_category
    ON mtm_nft_category.nft_id = nft.id
  LEFT JOIN mtm_kanvas_user_nft
    ON mtm_kanvas_user_nft.nft_id = nft.id
  LEFT JOIN kanvas_user
    ON mtm_kanvas_user_nft.kanvas_user_id = kanvas_user.id
  WHERE (until_filter IS NULL OR nft.created_at <= until_filter)
    AND (address_filter IS NULL OR kanvas_user.address = address_filter)
    AND (categories_filter IS NULL OR nft_category_id = ANY(categories_filter))
$$ LANGUAGE SQL;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION price_bounds(
  TEXT, INTEGER[],
  TIMESTAMP WITHOUT TIME ZONE);

COMMIT;
