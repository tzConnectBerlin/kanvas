-- Migration: mtm_kanvas_user_nft
-- Created at: 2021-11-10 12:36:09
-- ====  UP  ====

BEGIN;

CREATE TABLE mtm_kanvas_user_nft (
       kanvas_user_id INT REFERENCES kanvas_user(id) ON UPDATE CASCADE ON DELETE CASCADE,
       nft_id INT REFERENCES nft(id) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE mtm_kanvas_user_nft;

COMMIT;
