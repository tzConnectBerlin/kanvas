-- Migration: nft_functions_v12
-- Created at: 2021-12-02 13:23:21
-- ====  UP  ====

BEGIN;

-- Diff between previous and this version:
--   - additionally returns editions_size
--   - additionally returns identifiers of categories
ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v12;
CREATE FUNCTION nfts_by_id(ids INTEGER[], orderBy TEXT, orderDirection TEXT)
  RETURNS TABLE(
    nft_id INTEGER, nft_created_at TIMESTAMP WITHOUT TIME ZONE, launch_at TIMESTAMP WITHOUT TIME ZONE, nft_name TEXT, ipfs_hash TEXT, metadata jsonb, data_uri TEXT, contract TEXT, price NUMERIC, token_id TEXT, editions_size INTEGER, categories TEXT[][], editions_available BIGINT)
AS $$
BEGIN
  IF orderDirection NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nfts_by_id(): invalid orderDirection';
  END IF;
  RETURN QUERY EXECUTE '
    SELECT
      nft.id AS nft_id,
      created_at AS nft_created_at,
      launch_at,
      nft_name,
      ipfs_hash,
      metadata,
      data_uri,
      contract,
      price,
      token_id,
      nft.editions_size,
      ARRAY_AGG(ARRAY[cat.id::text, category, cat.description]) AS categories,
      nft.editions_size - (
        SELECT reserved + owned FROM nft_editions_locked(nft.id)
      ) AS editions_available
    FROM nft
    JOIN mtm_nft_category AS mtm
      ON mtm.nft_id = nft.id
    JOIN nft_category AS cat
      ON mtm.nft_category_id = cat.id
    WHERE nft.id = ANY($1)
    GROUP BY
      nft.id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id, nft.editions_size, nft.created_at, launch_at
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection
    USING ids;
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v11 RENAME TO nfts_by_id;

COMMIT;
