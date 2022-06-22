-- Migration: nft-ids-filtered-v4-AND-nfts_by_id_v6
-- Created at: 2022-06-22 14:20:38
-- ====  UP  ====

BEGIN;

ALTER FUNCTION nfts_by_id RENAME TO __nfts_by_id_v5;
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
    WHERE nft.id = ANY($1)
    ORDER BY ' || quote_ident(orderBy) || ' ' || orderDirection
    USING ids, forRecvAddress;
END
$$
LANGUAGE plpgsql;

-- ALTER FUNCTION nft_ids_filtered RENAME TO __nft_ids_filtered_v3;
-- CREATE FUNCTION nft_ids_filtered(
--     address TEXT, categories INTEGER[],
--     price_at_least NUMERIC, price_at_most NUMERIC,
--     availability TEXT[], ending_soon_duration INTERVAL,
--     order_by TEXT, order_direction TEXT,
--     "offset" INTEGER, "limit" INTEGER,
--     until TIMESTAMP WITHOUT TIME ZONE,
--     minter_address TEXT)
--   RETURNS TABLE(nft_id nft.id%TYPE, total_nft_count bigint)
-- AS $$
-- BEGIN
--   IF order_direction NOT IN ('asc', 'desc') THEN
--     RAISE EXCEPTION 'nft_ids_filtered(): invalid order_direction';
--   END IF;
--   IF NOT (availability <@ '{soldOut, onSale, upcoming, endingSoon}'::text[]) THEN
--     RAISE EXCEPTION 'nft_ids_filtered(): invalid availability';
--   END IF;
--   RETURN QUERY EXECUTE '
--     SELECT
--       nft_id,
--       total_nft_count
--     FROM (
--       SELECT
--         nft.id as nft_id,
--         nft.created_at as nft_created_at,
--         COUNT(1) OVER () AS total_nft_count
--       FROM nft
--       JOIN mtm_nft_category
--         ON mtm_nft_category.nft_id = nft.id
--       LEFT JOIN mtm_kanvas_user_nft
--         ON mtm_kanvas_user_nft.nft_id = nft.id
--       LEFT JOIN kanvas_user
--         ON mtm_kanvas_user_nft.kanvas_user_id = kanvas_user.id
--       WHERE ($1 IS NULL OR nft.created_at <= $1)
--         AND ($2 IS NULL OR (
--               EXISTS (
--                 SELECT 1
--                 FROM onchain_kanvas."storage.ledger_live"
--                 WHERE idx_assets_address = $2
--                   AND idx_assets_nat = nft.id
--               ) OR (
--                 purchased_editions_pending_transfer(nft.id, $2, $10) > 0
--               )
--             ))
--         AND ($3 IS NULL OR nft_category_id = ANY($3))
--         AND ($4 IS NULL OR nft.price >= $4)
--         AND ($5 IS NULL OR nft.price <= $5)
--         AND ($6 IS NULL OR (
--               (' || quote_literal('onSale') || ' = ANY($6) AND (
--                     (nft.onsale_from IS NULL OR nft.onsale_from <= now() AT TIME ZONE ' || quote_literal('UTC') || ')
--                 AND (nft.onsale_until IS NULL OR nft.onsale_until > now())
--                 AND ((SELECT reserved + owned FROM nft_editions_locked(nft.id)) < nft.editions_size)
--               )) OR
--               (' || quote_literal('soldOut') || ' = ANY($6) AND (
--                 (
--                   SELECT reserved + owned FROM nft_editions_locked(nft.id)
--                 ) >= nft.editions_size
--               )) OR
--               (' || quote_literal('upcoming') || ' = ANY($6) AND (
--                 nft.onsale_from > now() AT TIME ZONE ' || quote_literal('UTC') || '
--               )) OR
--               (' || quote_literal('endingSoon') || ' = ANY($6) AND (
--                   nft.onsale_until BETWEEN (now() AT TIME ZONE ' || quote_literal('UTC') || ') AND (now() AT TIME ZONE ' || quote_literal('UTC') || ' + $7)
--               ))
--             ))
--       GROUP BY nft.id, nft.created_at
--       ORDER BY ' || quote_ident(order_by) || ' ' || order_direction || '
--       OFFSET $8
--       LIMIT  $9
--     ) q'
--     USING until, address, categories, price_at_least, price_at_most, availability, ending_soon_duration, "offset", "limit", minter_address;
-- END
-- $$
-- LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nfts_by_id(INTEGER[], TEXT, TEXT, TEXT);
ALTER FUNCTION __nfts_by_id_v5 RENAME TO nfts_by_id;

COMMIT;
