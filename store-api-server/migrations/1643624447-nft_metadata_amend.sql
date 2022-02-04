-- Migration: nft_metadata_amend
-- Created at: 2022-01-31 11:20:47
-- ====  UP  ====

BEGIN;

ALTER TABLE nft RENAME COLUMN data_uri TO artifact_uri;

ALTER TABLE nft ALTER COLUMN artifact_uri SET NOT NULL;
ALTER TABLE nft ADD COLUMN display_uri TEXT;
ALTER TABLE nft ADD COLUMN thumbnail_uri TEXT;

ALTER TABLE nft DROP COLUMN metadata;
ALTER TABLE nft DROP COLUMN token_id;
ALTER TABLE nft DROP COLUMN contract;

ALTER TABLE nft ALTER COLUMN price SET NOT NULL;
ALTER TABLE nft ALTER COLUMN editions_size SET NOT NULL;
ALTER TABLE nft ALTER COLUMN editions_size DROP DEFAULT;
ALTER TABLE nft ALTER COLUMN description SET NOT NULL;

ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v14;
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
      editions_size - (
        SELECT reserved + owned FROM nft_editions_locked(nft.id)
      ) AS editions_available,
      cat.categories
    FROM nft
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
ALTER FUNCTION __nfts_by_id_v14 RENAME TO nfts_by_id;

ALTER TABLE nft ALTER COLUMN artifact_uri DROP NOT NULL;
ALTER TABLE nft RENAME COLUMN artifact_uri TO data_uri;

ALTER TABLE nft DROP COLUMN display_uri;
ALTER TABLE nft DROP COLUMN thumbnail_uri;

ALTER TABLE nft ADD COLUMN metadata jsonb;
ALTER TABLE nft ADD COLUMN token_id text;
ALTER TABLE nft ADD COLUMN contract text;

ALTER TABLE nft ALTER COLUMN price DROP NOT NULL;
ALTER TABLE nft ALTER COLUMN editions_size DROP NOT NULL;
ALTER TABLE nft ALTER COLUMN editions_size SET DEFAULT 1;
ALTER TABLE nft ALTER COLUMN description DROP NOT NULL;

COMMIT;
