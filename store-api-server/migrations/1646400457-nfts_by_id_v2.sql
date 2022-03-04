-- Migration: nfts_by_id_v2
-- Created at: 2022-03-04 14:27:37
-- ====  UP  ====

BEGIN;

ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v1;
CREATE FUNCTION nfts_by_id(ids INTEGER[], orderBy TEXT, orderDirection TEXT)
  RETURNS TABLE(
    nft_id INTEGER, nft_created_at TIMESTAMP WITHOUT TIME ZONE, launch_at TIMESTAMP WITHOUT TIME ZONE, nft_name TEXT, description TEXT, ipfs_hash TEXT, artifact_uri TEXT, display_uri TEXT, thumbnail_uri TEXT, price NUMERIC, editions_size INTEGER, editions_available BIGINT, categories TEXT[][])
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
      launch_at,
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
    FROM nft, nft_editions_locked(nft.id) AS availability
    JOIN nft_categories AS cat
      ON cat.nft_id = nft.id
    WHERE nft.id = ANY($1)
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection
    USING ids;
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v1 RENAME TO nfts_by_id;

COMMIT;
