-- Migration: nft-not-null_created_at
-- Created at: 2022-11-24 17:17:57
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ALTER COLUMN created_at SET NOT NULL;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft ALTER COLUMN created_at DROP NOT NULL;

COMMIT;
