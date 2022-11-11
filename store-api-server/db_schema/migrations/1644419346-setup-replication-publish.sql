-- Migration: setup-replication-publish
-- Created at: 2022-02-09 16:09:06
-- ====  UP  ====

BEGIN;

CREATE PUBLICATION store_pub FOR TABLE
  cart_session,
  kanvas_user,
  mtm_cart_session_nft,
  mtm_kanvas_user_nft,
  mtm_nft_category,
  mtm_nft_order_nft,
  nft,
  nft_category,
  nft_order,
  payment;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP PUBLICATION store_pub;

COMMIT;
