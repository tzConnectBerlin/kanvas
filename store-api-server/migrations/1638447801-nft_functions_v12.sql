-- Migration: nft_functions_v12
-- Created at: 2021-12-02 13:23:21
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ADD COLUMN description TEXT;

-- Diff between previous and this version:
--   - additionally returns description
--   - additionally returns editions_size
--   - additionally returns identifiers of categories
--   - improved efficiency by grouping nft categories outside of main select
--     (this prevents needing to group by basically all nft fields, instead it
  --    is only necessary to group by nft id in the isolated WITH definition)
ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v12;
CREATE FUNCTION nfts_by_id(ids INTEGER[], orderBy TEXT, orderDirection TEXT)
  RETURNS TABLE(
    nft_id INTEGER, nft_created_at TIMESTAMP WITHOUT TIME ZONE, launch_at TIMESTAMP WITHOUT TIME ZONE, nft_name TEXT, description TEXT, ipfs_hash TEXT, metadata jsonb, data_uri TEXT, contract TEXT, price NUMERIC, token_id TEXT, editions_size INTEGER, editions_available BIGINT, categories TEXT[][])
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
      metadata,
      data_uri,
      contract,
      price,
      token_id,
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
ALTER FUNCTION __nfts_by_id_v12 RENAME TO nfts_by_id;

COMMIT;
