-- Migration: bugfix_nfts-by-id-v7
-- Created at: 2022-06-29 13:40:36
-- ====  UP  ====

BEGIN;

ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v6;
CREATE FUNCTION nfts_by_id(ids INTEGER[], orderBy TEXT, orderDirection TEXT, forRecvAddress TEXT)
  RETURNS TABLE(
    nft_id INTEGER,
    nft_created_at TIMESTAMP WITHOUT TIME ZONE,
    nft_name TEXT,
    description TEXT,

    price NUMERIC,
    editions_size INTEGER,
    onsale_from TIMESTAMP WITHOUT TIME ZONE,
    onsale_until TIMESTAMP WITHOUT TIME ZONE,
    categories TEXT[][],
    metadata JSONB,

    artifact_uri TEXT,
    display_uri TEXT,
    thumbnail_uri TEXT,

    metadata_ipfs TEXT,
    artifact_ipfs TEXT,
    display_ipfs TEXT,
    thumbnail_ipfs TEXT,

    editions_reserved BIGINT,
    editions_owned BIGINT,

    mint_op_hash TEXT,
    owned_recv_op_hashes TEXT[])
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
    ), for_address_transfers AS (
      SELECT
        SUM(tr_dest.amount) OVER (
          PARTITION BY tr_dest.token_id
          ORDER BY
            ctx.level DESC,
            ctx.operation_group_number DESC,
            ctx.operation_number DESC,
            ctx.content_number DESC,
            COALESCE(ctx.internal_number, -1) DESC
        ) AS accum_recv,
        tr_dest.token_id,
        array_fill(tx.operation_hash::text, ARRAY[tr_dest.amount::INT]) AS op_hashes
      FROM onchain_kanvas."entry.transfer.noname.txs" AS tr_dest
      JOIN que_pasa.tx_contexts AS ctx
        ON ctx.id = tr_dest.tx_context_id
      JOIN que_pasa.txs AS tx
        ON tx.tx_context_id = ctx.id
      WHERE tr_dest.to_ = $2
        AND tr_dest.token_id = ANY($1)
    ), for_address_owned AS (
      SELECT
        ledger.idx_assets_nat AS token_id,
        ledger.assets_nat AS num
      FROM onchain_kanvas."storage.ledger_live" AS ledger
      WHERE ledger.idx_assets_address = $2
    ), for_address_owned_metadata AS (
      SELECT
        tr.token_id,
        (ARRAY_AGG(op_hash ORDER BY tr.accum_recv ASC))[1:(SELECT owned.num FROM for_address_owned AS owned WHERE owned.token_id = tr.token_id)] AS owned_recv_op_hashes
      FROM for_address_transfers AS tr, UNNEST(tr.op_hashes) AS op_hash
      WHERE tr.accum_recv <= (SELECT owned.num FROM for_address_owned AS owned WHERE owned.token_id = tr.token_id)
      GROUP BY tr.token_id
    )
    SELECT
      nft.id AS nft_id,
      created_at AS nft_created_at,
      nft_name,
      description,

      price,
      editions_size,
      onsale_from,
      onsale_until,
      cat.categories,
      metadata,

      artifact_uri,
      display_uri,
      thumbnail_uri,

      metadata_ipfs,
      artifact_ipfs,
      display_ipfs,
      thumbnail_ipfs,

      availability.reserved AS editions_reserved,
      availability.owned AS editions_owned,

      mint.included_in::TEXT AS mint_op_hash,
      for_address.owned_recv_op_hashes
    FROM nft
    JOIN nft_categories AS cat
      ON cat.nft_id = nft.id
    CROSS JOIN nft_editions_locked(nft.id) AS availability
    LEFT JOIN for_address_owned_metadata AS for_address
      ON for_address.token_id = nft.id
    LEFT JOIN peppermint.operations AS mint
      ON  mint.command->>'||quote_literal('name')||' = '||quote_literal('create_and_mint')||'
      AND (mint.command->'||quote_literal('args')||'->'||quote_literal('token_id')||')::INT = nft.id
      AND mint.state = '||quote_literal('confirmed')||'
    WHERE nft.id = ANY($1)
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection
    USING ids, forRecvAddress;
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v6 RENAME TO nfts_by_id;

COMMIT;
