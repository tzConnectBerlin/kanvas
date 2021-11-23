-- Migration: nfts_filtered_v4
-- Created at: 2021-11-23 17:38:29
-- ====  UP  ====

BEGIN;

CREATE INDEX ON mtm_nft_category(nft_category_id);
CREATE INDEX ON mtm_nft_category(nft_id);
CREATE INDEX ON mtm_kanvas_user_nft(kanvas_user_id);
CREATE INDEX ON mtm_kanvas_user_nft(nft_id);

CREATE FUNCTION nft_editions_locked(id INTEGER)
  RETURNS TABLE(reserved BIGINT, owned BIGINT)
AS $$
  SELECT
    (SELECT count(1) FROM mtm_cart_session_nft WHERE nft_id = id) as reserved,
    (SELECT count(1) FROM mtm_kanvas_user_nft WHERE nft_id = id) as owned
$$ LANGUAGE SQL;

-- Diff between previous and this version:
--   additionally return # of available editions
ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v3;
CREATE FUNCTION nfts_by_id(ids INTEGER[], orderBy TEXT, orderDirection TEXT)
  RETURNS TABLE(
    nft_id INTEGER, nft_name TEXT, ipfs_hash TEXT, metadata jsonb, data_uri TEXT, contract TEXT, token_id TEXT, categories TEXT[][], editions_available BIGINT)
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
      ARRAY_AGG(ARRAY[category, cat.description]) AS categories,
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
      nft.id, nft_name, ipfs_hash, metadata, data_uri, contract, token_id, nft.editions_size
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection
    USING ids;
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v3 RENAME TO nfts_by_id;

DROP FUNCTION nft_editions_locked(INTEGER);

COMMIT;
