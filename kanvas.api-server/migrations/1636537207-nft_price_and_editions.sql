-- Migration: nft_price_and_editions
-- Created at: 2021-11-10 10:40:07
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ADD COLUMN price NUMERIC;
ALTER TABLE nft ADD COLUMN editions_size INTEGER;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft DROP COLUMN price;
ALTER TABLE nft DROP COLUMN editions_size;

COMMIT;
