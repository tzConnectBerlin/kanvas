-- Migration: non-null-usernames
-- Created at: 2021-11-30 15:14:42
-- ====  UP  ====

BEGIN;

UPDATE kanvas_user
SET user_name = id::text
WHERE user_name IS NULL;

ALTER TABLE kanvas_user ALTER COLUMN user_name SET NOT NULL;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE kanvas_user ALTER COLUMN user_name DROP NOT NULL;

COMMIT;
