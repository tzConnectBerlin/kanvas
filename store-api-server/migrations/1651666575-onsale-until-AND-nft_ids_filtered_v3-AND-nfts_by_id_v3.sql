-- Migration: onsale-until-AND-nft_ids_filtered_v3-AND-nfts_by_id_v3
-- Created at: 2022-05-04 14:16:15
-- ====  UP  ====

BEGIN;

ALTER TABLE nft RENAME COLUMN launch_at TO onsale_from;
ALTER TABLE nft ADD COLUMN onsale_until TIMESTAMP WITHOUT TIME ZONE;

ALTER FUNCTION nft_ids_filtered RENAME TO __nft_ids_filtered_v2;
CREATE FUNCTION nft_ids_filtered(
    address TEXT, categories INTEGER[],
    price_at_least NUMERIC, price_at_most NUMERIC,
    availability TEXT[], ends_soon_duration INTERVAL,
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
  IF NOT (availability <@ '{soldOut, onSale, upcoming, endingSoon}'::text[]) THEN
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
                purchased_editions_pending_transfer(nft.id, $2, $10) > 0
              )
            ))
        AND ($3 IS NULL OR nft_category_id = ANY($3))
        AND ($4 IS NULL OR nft.price >= $4)
        AND ($5 IS NULL OR nft.price <= $5)
        AND ($6 IS NULL OR (
              (' || quote_literal('onSale') || ' = ANY($6) AND (
                    (nft.onsale_from IS NULL OR nft.onsale_from <= now() AT TIME ZONE ' || quote_literal('UTC') || ')
                AND (nft.onsale_until IS NULL OR nft.onsale_until > now())
                AND ((SELECT reserved + owned FROM nft_editions_locked(nft.id)) < nft.editions_size)
              )) OR
              (' || quote_literal('soldOut') || ' = ANY($6) AND (
                (
                  SELECT reserved + owned FROM nft_editions_locked(nft.id)
                ) >= nft.editions_size
              )) OR
              (' || quote_literal('upcoming') || ' = ANY($6) AND (
                nft.onsale_from > now() AT TIME ZONE ' || quote_literal('UTC') || '
              )) OR
              (' || quote_literal('endingSoon') || ' = ANY($6) AND (
                  nft.onsale_until BETWEEN (now() AT TIME ZONE ' || quote_literal('UTC') || ') AND (now() AT TIME ZONE ' || quote_literal('UTC') || ' + $7)
              ))
            ))
      GROUP BY nft.id, nft.created_at
      ORDER BY ' || quote_ident(order_by) || ' ' || order_direction || '
      OFFSET $8
      LIMIT  $9
    ) q'
    USING until, address, categories, price_at_least, price_at_most, availability, ends_soon_duration, "offset", "limit", minter_address;
END
$$
LANGUAGE plpgsql;

ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v2;
CREATE FUNCTION nfts_by_id(ids INTEGER[], orderBy TEXT, orderDirection TEXT)
  RETURNS TABLE(
    nft_id INTEGER,
    nft_created_at TIMESTAMP WITHOUT TIME ZONE,
    onsale_from TIMESTAMP WITHOUT TIME ZONE,
    onsale_until TIMESTAMP WITHOUT TIME ZONE,
    nft_name TEXT,
    description TEXT,
    ipfs_hash TEXT,
    artifact_uri TEXT,
    display_uri TEXT,
    thumbnail_uri TEXT,
    price NUMERIC,
    editions_size INTEGER,
    editions_reserved BIGINT,
    editions_owned BIGINT,
    categories TEXT[][])
AS $$
BEGIN
  IF orderDirection NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nfts_by_id(): invalid orderDirection';
  END IF;
  RETURN QUERY EXECUTE '
    WITH nft_categories AS (
      SELECT
        nft.id AS nft_id,
        ARRAY_AGG(ARRAY[cat.id::text, category, cat.description]) AS categories
      FROM nft
      JOIN mtm_nft_category AS mtm
        ON mtm.nft_id = nft.id
      JOIN nft_category AS cat
        ON mtm.nft_category_id = cat.id
      WHERE nft.id = ANY($1)
      GROUP BY nft.id
    )
    SELECT
      nft.id AS nft_id,
      created_at AS nft_created_at,
      onsale_from,
      onsale_until,
      nft_name,
      description,
      ipfs_hash,
      artifact_uri,
      display_uri,
      thumbnail_uri,
      price,
      editions_size,
      availability.reserved AS editions_reserved,
      availability.owned AS editions_owned,
      cat.categories
    FROM nft
    JOIN nft_categories AS cat
      ON cat.nft_id = nft.id
    CROSS JOIN nft_editions_locked(nft.id) AS availability
    WHERE nft.id = ANY($1)
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection
    USING ids;
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft RENAME COLUMN onsale_from TO launch_at;
ALTER TABLE nft DROP COLUMN onsale_until;

DROP FUNCTION nft_ids_filtered(
  TEXT, INTEGER[],
  NUMERIC, NUMERIC,
  TEXT[],
  TEXT, TEXT,
  INTEGER, INTEGER,
  TIMESTAMP WITHOUT TIME ZONE,
  TEXT);
ALTER FUNCTION __nft_ids_filtered_v2 RENAME TO nft_ids_filtered;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v2 RENAME TO nfts_by_id;

COMMIT;
