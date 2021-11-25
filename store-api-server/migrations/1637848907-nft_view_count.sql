-- Migration: nft_view_count
-- Created at: 2021-11-25 15:01:47
-- ====  UP  ====

BEGIN;

ALTER TABLE nft ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;
CREATE INDEX ON nft(view_count);

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft DROP COLUMN view_count;

COMMIT;
