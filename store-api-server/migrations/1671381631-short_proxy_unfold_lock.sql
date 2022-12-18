-- Migration: short_proxy_unfold_lock
-- Created at: 2022-12-18 17:40:31
-- ====  UP  ====

BEGIN;

ALTER TABLE proxy_unfold ADD COLUMN claimed_for_order INT;

COMMIT;

-- ==== DOWN ====

BEGIN;

COMMIT;
