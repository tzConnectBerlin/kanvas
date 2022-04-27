-- Migration: nft-delisting
-- Created at: 2022-04-27 17:54:52
-- ====  UP  ====

BEGIN;

UPDATE TABLE nft ADD COLUMN delisted BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;

-- ==== DOWN ====

BEGIN;

UPDATE TABLE nft DROP COLUMN delisted;

COMMIT;
