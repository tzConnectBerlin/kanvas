-- Migration: price_bounds_v2
-- Created at: 2022-05-05 12:30:35
-- ====  UP  ====

BEGIN;

ALTER FUNCTION price_bounds RENAME TO __price_bounds_v1;
CREATE FUNCTION price_bounds(
  address_filter TEXT, categories_filter INTEGER[],
  availability_filter TEXT[], ends_soon_duration INTERVAL,
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
    AND (availability_filter IS NULL OR (
          ('onSale' = ANY(availability_filter) AND (
            (nft.onsale_from IS NULL OR nft.onsale_from <= now() AT TIME ZONE 'UTC')
            AND (nft.onsale_until IS NULL OR nft.onsale_until > now())
            AND ((SELECT reserved + owned FROM nft_editions_locked(nft.id)) < nft.editions_size)
          )) OR
          ('soldOut' = ANY(availability_filter) AND (
            (
              SELECT reserved + owned FROM nft_editions_locked(nft.id)
            ) >= nft.editions_size
          )) OR
          ('upcoming' = ANY(availability_filter) AND (
            nft.onsale_from > now() AT TIME ZONE 'UTC'
          )) OR
          ('endingSoon' = ANY(availability_filter) AND (
            nft.onsale_until BETWEEN (now() AT TIME ZONE 'UTC') AND (now() AT TIME ZONE 'UTC' + ending_soon_duration)
          ))
        ))
$$ LANGUAGE SQL;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION price_bounds(TEXT, INTEGER[], TEXT[], TIMESTAMP WITHOUT TIME ZONE);
ALTER FUNCTION __price_bounds_v1 RENAME TO price_bounds;

COMMIT;
