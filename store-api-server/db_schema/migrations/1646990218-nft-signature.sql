-- Migration: nft-signature
-- Created at: 2022-03-11 10:16:58
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ADD COLUMN signature TEXT;
UPDATE nft SET signature = '';
ALTER TABLE nft ALTER COLUMN signature SET NOT NULL;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft DROP COLUMN signature;

COMMIT;
