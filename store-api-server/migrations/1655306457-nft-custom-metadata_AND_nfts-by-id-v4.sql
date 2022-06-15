-- Migration: nft-custom-metadata_AND_nfts-by-id-v4
-- Created at: 2022-06-15 17:20:57
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ADD COLUMN metadata JSONB;
ALTER TABLE __nft_delisted ADD COLUMN metadata JSONB;

ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v3;
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
    categories TEXT[][],
    metadata JSONB)
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
      cat.categories,
      metadata
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

ALTER TABLE nft DROP COLUMN metadata;
ALTER TABLE __nft_delisted DROP COLUMN metadata;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v3 RENAME TO nfts_by_id;

COMMIT;
