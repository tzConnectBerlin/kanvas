-- Migration: replication-pub-part2
-- Created at: 2022-01-27 15:34:32
-- ====  UP  ====

BEGIN;

CREATE PUBLICATION store_pub FOR TABLE
  cart_session,
  kanvas_user,
  mtm_cart_session_nft,
  mtm_kanvas_user_nft,
  mtm_nft_category,
  mtm_nft_order_nft,
  mtm_kanvas_user_user_role,
  nft,
  nft_category,
  nft_order,
  payment,
  user_role;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP PUBLICATION store_pub;

COMMIT;
