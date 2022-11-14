-- Migration: nft-custom-metadata
-- Created at: 2022-06-15 17:20:57
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ADD COLUMN metadata JSONB;
ALTER TABLE __nft_delisted ADD COLUMN metadata JSONB;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft DROP COLUMN metadata;
ALTER TABLE __nft_delisted DROP COLUMN metadata;

COMMIT;
