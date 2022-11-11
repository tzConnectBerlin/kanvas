-- Migration: unique_payment_nft_order_id
-- Created at: 2022-04-13 16:46:12
-- ====  UP  ====

BEGIN;

ALTER TABLE payment ADD CONSTRAINT payment_nft_order_id_uniq UNIQUE(nft_order_id);
ALTER TABLE mtm_nft_category ADD CONSTRAINT mtm_nft_category_uniq UNIQUE(nft_id, nft_category_id);

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE payment DROP CONSTRAINT payment_nft_order_id_uniq;
ALTER TABLE mtm_nft_category DROP CONSTRAINT mtm_nft_category_uniq;

COMMIT;
