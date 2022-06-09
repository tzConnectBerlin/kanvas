-- Migration: payment-price-freeze
-- Created at: 2022-06-09 12:27:54
-- ====  UP  ====

BEGIN;

ALTER TABLE nft_order ADD COLUMN currency TEXT;
UPDATE nft_order
SET currency = 'unknown';
ALTER TABLE nft_order ALTER COLUMN currency SET NOT NULL;

ALTER TABLE mtm_nft_order_nft ADD COLUMN price TEXT;
UPDATE mtm_nft_order_nft
SET price = '0';
ALTER TABLE mtm_nft_order_nft ALTER COLUMN price SET NOT NULL;


ALTER TABLE __mtm_nft_order_nft_delisted ADD COLUMN price TEXT;
UPDATE __mtm_nft_order_nft_delisted
SET price = '0';
ALTER TABLE __mtm_nft_order_nft_delisted ALTER COLUMN price SET NOT NULL;


COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft_order DROP COLUMN currency;
ALTER TABLE mtm_nft_order_nft DROP COLUMN price;
ALTER TABLE __mtm_nft_order_nft_delisted DROP COLUMN price;

COMMIT;
