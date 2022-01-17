-- Migration: pending-fix-part3
-- Created at: 2022-01-14 18:14:39
-- ====  UP  ====

BEGIN;

ALTER FUNCTION purchased_editions_pending_transfer RENAME TO __purchased_editions_pending_transfer_v3;
CREATE FUNCTION purchased_editions_pending_transfer(
  purchased_nft_id INTEGER, buyer_address TEXT, minter_address TEXT)
RETURNS INTEGER
AS $$
  WITH onchain_registered AS (
    SELECT
      mint.command->'args'->>'amount' AS amount
    FROM peppermint.operations AS mint
    WHERE mint.command->>'handler' = 'nft'
      AND mint.command->>'name'::TEXT = 'transfer'
      AND (mint.command->'args'->'token_id')::INTEGER = purchased_nft_id
      AND mint.command->'args'->>'from_address' = minter_address
      AND mint.command->'args'->>'to_address' = buyer_address
      AND EXISTS (
        SELECT 1
        FROM txs AS onchain_tx
        WHERE onchain_tx.operation_hash = mint.included_in
      )
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
ALTER FUNCTION __purchased_editions_pending_transfer_v3 RENAME TO purchased_editions_pending_transfer;

COMMIT;
