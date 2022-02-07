-- Migration: nft_publishable
-- Created at: 2022-02-04 12:04:34
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ALTER COLUMN ipfs_hash DROP NOT NULL;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft ALTER COLUMN ipfs_hash SET NOT NULL;

COMMIT;
