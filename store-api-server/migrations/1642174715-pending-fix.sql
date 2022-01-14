-- Migration: pending-fix
-- Created at: 2022-01-14 16:38:35
-- ====  UP  ====

BEGIN;

ALTER FUNCTION purchased_editions_pending_transfer RENAME TO __purchased_editions_pending_transfer_v1;
-- changes:
--  bugfix: there was a small window between pending and quepasa reading the
--          actual transaction and picking it up into the ledger_live table,
--          therefore we must also look at what quepasa has processed here.
CREATE FUNCTION purchased_editions_pending_transfer(
  purchased_nft_id INTEGER, buyer_address TEXT, minter_address TEXT)
RETURNS INTEGER
AS $$
  SELECT
    COUNT(mtm) -
      COALESCE(SUM(onchain_registered.amount::INTEGER), 0)
      AS num_editions
  FROM (
    SELECT
      mint.command->'args'->>'amount' AS amount
    FROM peppermint.operations AS mint
    JOIN txs AS onchain_tx
      ON onchain_tx.operation_hash = mint.included_in
    WHERE mint.command->>'handler' = 'nft'
      AND mint.command->>'name'::TEXT = 'transfer'
      AND (mint.command->'args'->'token_id')::INTEGER = purchased_nft_id
      AND mint.command->'args'->>'from_address' = minter_address
      AND mint.command->'args'->>'to_address' = buyer_address
  ) AS onchain_registered, kanvas_user AS usr
  JOIN mtm_kanvas_user_nft AS mtm
    ON  mtm.kanvas_user_id = usr.id
    AND mtm.nft_id = purchased_nft_id
  WHERE usr.address = buyer_address
$$ LANGUAGE SQL;

CREATE INDEX txs_operation_hash_idx ON txs(operation_hash);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP INDEX txs_operation_hash_idx;

DROP FUNCTION purchased_editions_pending_transfer(INTEGER, TEXT, TEXT);
ALTER FUNCTION __purchased_editions_pending_transfer_v1 RENAME TO purchased_editions_pending_transfer;

COMMIT;
