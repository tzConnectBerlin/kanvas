-- Migration: categories-custom-metadata
-- Created at: 2022-06-16 14:22:37
-- ====  UP  ====

BEGIN;

ALTER TABLE nft_category ADD COLUMN metadata JSONB;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft_category DROP COLUMN metadata;

COMMIT;
