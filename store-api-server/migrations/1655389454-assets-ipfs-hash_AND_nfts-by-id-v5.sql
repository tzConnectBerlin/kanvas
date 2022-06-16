-- Migration: assets-ipfs-hash_AND_nfts-by-id-v5
-- Created at: 2022-06-16 16:24:14
-- ====  UP  ====

BEGIN;

ALTER TABLE nft RENAME COLUMN ipfs_hash TO metadata_ipfs;
ALTER TABLE nft ADD COLUMN artifact_ipfs TEXT;
ALTER TABLE nft ADD COLUMN display_ipfs TEXT;
ALTER TABLE nft ADD COLUMN thumbnail_ipfs TEXT;

ALTER TABLE __nft_delisted RENAME COLUMN ipfs_hash TO metadata_ipfs;
ALTER TABLE __nft_delisted ADD COLUMN artifact_ipfs TEXT;
ALTER TABLE __nft_delisted ADD COLUMN display_ipfs TEXT;
ALTER TABLE __nft_delisted ADD COLUMN thumbnail_ipfs TEXT;

ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v4;
CREATE FUNCTION nfts_by_id(ids INTEGER[], orderBy TEXT, orderDirection TEXT)
  RETURNS TABLE(
    nft_id INTEGER,
    nft_created_at TIMESTAMP WITHOUT TIME ZONE,
    onsale_from TIMESTAMP WITHOUT TIME ZONE,
    onsale_until TIMESTAMP WITHOUT TIME ZONE,
    nft_name TEXT,
    description TEXT,
    metadata_ipfs TEXT,
    artifact_ipfs TEXT,
    display_ipfs TEXT,
    thumbnail_ipfs TEXT,
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
      metadata_ipfs,
      artifact_ipfs,
      display_ipfs,
      thumbnail_ipfs,
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

ALTER TABLE nft RENAME COLUMN metadata_ipfs TO ipfs_hash;
ALTER TABLE nft DROP COLUMN artifact_ipfs;
ALTER TABLE nft DROP COLUMN display_ipfs;
ALTER TABLE nft DROP COLUMN thumbnail_ipfs;

ALTER TABLE __nft_delisted RENAME COLUMN metadata_ipfs TO ipfs_hash;
ALTER TABLE __nft_delisted DROP COLUMN artifact_ipfs;
ALTER TABLE __nft_delisted DROP COLUMN display_ipfs;
ALTER TABLE __nft_delisted DROP COLUMN thumbnail_ipfs;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v4 RENAME TO nfts_by_id;

COMMIT;
