-- Migration: nft_functions_v2
-- Created at: 2021-11-12 11:03:17
-- ====  UP  ====

BEGIN;

-- Diff between previous and this version:
--   categories was TEXT[] (names), is now INTEGER[] (ids)
ALTER FUNCTION nft_ids_filtered RENAME TO __nft_ids_filtered_v1;
CREATE FUNCTION nft_ids_filtered(
    address TEXT, categories INTEGER[],
    orderBy TEXT, orderDirection TEXT,
    "offset" INTEGER, "limit" INTEGER,
    untilNftLastUpdated TIMESTAMP WITHOUT TIME ZONE)
  RETURNS TABLE(nft_id nft.id%TYPE, total_nft_count bigint)
AS $$
BEGIN
  IF orderDirection NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nfts_filtered(): invalid orderDirection';
  END IF;
  RETURN QUERY EXECUTE '
    SELECT
      nft.id as nft_id,
      COUNT(1) OVER () AS total_nft_count
    FROM nft
    LEFT JOIN mtm_nft_category
      ON mtm_nft_category.nft_id = nft.id
    JOIN mtm_kanvas_user_nft
      ON mtm_kanvas_user_nft.nft_id = nft.id
    JOIN kanvas_user
      ON mtm_kanvas_user_nft.kanvas_user_id = kanvas_user.id
    WHERE ($1 IS NULL OR nft.updated_at <= $1)
      AND ($2 IS NULL OR kanvas_user.address = $2)
      AND ($3 IS NULL OR nft_category_id = ANY($3))
    GROUP BY nft.id
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection || '
    OFFSET $4
    LIMIT  $5'
    USING untilNftLastUpdated, address, categories, "offset", "limit";
END
$$
LANGUAGE plpgsql;


-- Diff between previous and this version:
--   when an nft has 0 categories associated, the previous function would
--   return '[[NULL, NULL]]', now it returns '[]'
--
-- Exact diff:
--   - ARRAY_AGG(ARRAY[category, cat.description]) AS categories
--   + CASE WHEN count(category) = 0
--   +   THEN ARRAY[]::text[][]
--   +   ELSE ARRAY_AGG(ARRAY[category, cat.description])
--   + END AS categories
ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v1;
CREATE FUNCTION nfts_by_id(ids INTEGER[], orderBy TEXT, orderDirection TEXT)
  RETURNS TABLE(
    nft_id INTEGER, nft_name TEXT, ipfs_hash TEXT, metadata jsonb, data_uri TEXT, contract TEXT, token_id TEXT, categories TEXT[][])
AS $$
BEGIN
  IF orderDirection NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nfts_by_id(): invalid orderDirection';
  END IF;
  RETURN QUERY EXECUTE '
    SELECT
      nft.id as nft_id,
      nft_name,
      ipfs_hash,
      metadata,
      data_uri,
      contract,
      token_id,
      CASE WHEN count(category) = 0
        THEN ARRAY[]::text[][]
        ELSE ARRAY_AGG(ARRAY[category, cat.description])
      END AS categories
    FROM nft
    LEFT JOIN mtm_nft_category AS mtm
      ON mtm.nft_id = nft.id
    LEFT JOIN nft_category AS cat
      ON mtm.nft_category_id = cat.id
    WHERE nft.id = ANY($1)
    GROUP BY
      nft.id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection
    USING ids;
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nft_ids_filtered(
    TEXT, INTEGER[],
    TEXT, TEXT,
    INTEGER, INTEGER,
    TIMESTAMP WITHOUT TIME ZONE);
ALTER FUNCTION __nft_ids_filtered_v1 RENAME TO nft_ids_filtered;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v1 RENAME TO nfts_by_id;

COMMIT;
