-- Migration: nft-delisting
-- Created at: 2022-04-27 17:54:52
-- ====  UP  ====

BEGIN;

CREATE TABLE __nft_delisted (LIKE nft);
CREATE TABLE __mtm_kanvas_user_nft_delisted (LIKE mtm_kanvas_user_nft);
CREATE TABLE __mtm_nft_category_delisted (LIKE mtm_nft_category);
CREATE TABLE __mtm_nft_order_nft_delisted (LIKE mtm_nft_order_nft);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE __nft_delisted;
DROP TABLE __mtm_kanvas_user_nft_delisted;
DROP TABLE __mtm_nft_category_delisted;
DROP TABLE __mtm_nft_order_nft_delisted;

COMMIT;
