-- Migration: setup-replication-pub
-- Created at: 2022-01-20 12:10:53
-- ====  UP  ====

BEGIN;

-- Must alter all tables that dont have a PRIMARY KEY yet, it's needed for
-- logical replication to work

ALTER TABLE mtm_kanvas_user_nft ADD COLUMN id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY;
ALTER TABLE mtm_kanvas_user_user_role ADD COLUMN id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY;
ALTER TABLE mtm_nft_category ADD COLUMN id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY;
ALTER TABLE mtm_nft_order_nft ADD COLUMN id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE mtm_kanvas_user_nft DROP COLUMN id;
ALTER TABLE mtm_kanvas_user_user_role DROP COLUMN id;
ALTER TABLE mtm_nft_category DROP COLUMN id;
ALTER TABLE mtm_nft_order_nft DROP COLUMN id;

COMMIT;
