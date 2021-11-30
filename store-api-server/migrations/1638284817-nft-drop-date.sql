-- Migration: nft-drop-date
-- Created at: 2021-11-30 16:06:57
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ADD COLUMN launch_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC');

-- Diff between previous and this version:
--   - additionally returns launch_at field
ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v7;
CREATE FUNCTION nfts_by_id(ids INTEGER[], orderBy TEXT, orderDirection TEXT)
  RETURNS TABLE(
    nft_id INTEGER, nft_name TEXT, ipfs_hash TEXT, metadata jsonb, data_uri TEXT, contract TEXT, price NUMERIC, token_id TEXT, categories TEXT[][], editions_available BIGINT, launch_at TIMESTAMP WITHOUT TIME ZONE)
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
      price,
      token_id,
      ARRAY_AGG(ARRAY[category, cat.description]) AS categories,
      nft.editions_size - (
        SELECT reserved + owned FROM nft_editions_locked(nft.id)
      ) AS editions_available
      launch_at
    FROM nft
    JOIN mtm_nft_category AS mtm
      ON mtm.nft_id = nft.id
    JOIN nft_category AS cat
      ON mtm.nft_category_id = cat.id
    WHERE nft.id = ANY($1)
    GROUP BY
      nft.id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id, nft.editions_size
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection
    USING ids;
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft DROP COLUMN launch_at;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v7 RENAME TO nfts_by_id;

COMMIT;
