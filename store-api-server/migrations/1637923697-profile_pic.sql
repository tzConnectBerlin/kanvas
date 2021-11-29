-- Migration: profile_pic
-- Created at: 2021-11-26 11:48:17
-- ====  UP  ====

BEGIN;

-- bugfix: now() gives timestamps in the db server host's timezone by default
ALTER TABLE nft ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE 'UTC');
-- bugfix: nfts in the *store* don't update, this is an admin-api only thing
ALTER TABLE nft DROP COLUMN updated_at;

ALTER TABLE kanvas_user ADD COLUMN created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC');
ALTER TABLE kanvas_user ADD COLUMN picture_url TEXT;

-- Diff between previous and this version:
--   updated_at column deleted, so "untilNftLastUpdated" => "until_nft_created_at"
ALTER FUNCTION nft_ids_filtered RENAME TO __nft_ids_filtered_v6;
CREATE FUNCTION nft_ids_filtered(
    address TEXT, categories INTEGER[],
    price_at_least NUMERIC, price_at_most NUMERIC,
    order_by TEXT, order_direction TEXT,
    "offset" INTEGER, "limit" INTEGER,
    until TIMESTAMP WITHOUT TIME ZONE)
  RETURNS TABLE(nft_id nft.id%TYPE, total_nft_count bigint)
AS $$
BEGIN
  IF order_direction NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nfts_filtered(): invalid order_direction';
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
    GROUP BY nft.id
    ORDER BY ' || quote_ident(order_by) || ' ' || order_direction || '
    OFFSET $6
    LIMIT  $7'
    USING until, address, categories, price_at_least, price_at_most, "offset", "limit";
END
$$
LANGUAGE plpgsql;


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

ALTER TABLE nft ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE nft ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE kanvas_user DROP COLUMN created_at;
ALTER TABLE kanvas_user DROP COLUMN picture_url;

DROP FUNCTION nft_ids_filtered(
    TEXT, INTEGER[],
    NUMERIC, NUMERIC,
    TEXT, TEXT,
    INTEGER, INTEGER,
    TIMESTAMP WITHOUT TIME ZONE);
ALTER FUNCTION __nft_ids_filtered_v6 RENAME TO nft_ids_filtered;


COMMIT;
