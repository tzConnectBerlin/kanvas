-- Migration: pending-fix-part2
-- Created at: 2022-01-14 17:51:16
-- ====  UP  ====

BEGIN;

ALTER FUNCTION purchased_editions_pending_transfer RENAME TO __purchased_editions_pending_transfer_v2;
-- changes:
--  bugfix: there was a small window between pending and quepasa reading the
--          actual transaction and picking it up into the ledger_live table,
--          therefore we must also look at what quepasa has processed here.
CREATE FUNCTION purchased_editions_pending_transfer(
  purchased_nft_id INTEGER, buyer_address TEXT, minter_address TEXT)
RETURNS INTEGER
AS $$
  WITH onchain_registered AS (
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
  )
  SELECT
    COUNT(mtm) -
      COALESCE((SELECT SUM(amount::INTEGER) FROM onchain_registered), 0)
      AS num_editions
  FROM kanvas_user AS usr
  JOIN mtm_kanvas_user_nft AS mtm
    ON  mtm.kanvas_user_id = usr.id
    AND mtm.nft_id = purchased_nft_id
  WHERE usr.address = buyer_address
$$ LANGUAGE SQL;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION purchased_editions_pending_transfer(INTEGER, TEXT, TEXT);
ALTER FUNCTION __purchased_editions_pending_transfer_v2 RENAME TO purchased_editions_pending_transfer;

COMMIT;
