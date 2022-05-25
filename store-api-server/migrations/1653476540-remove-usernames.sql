-- Migration: remove-usernames
-- Created at: 2022-05-25 13:02:20
-- ====  UP  ====

BEGIN;

ALTER TABLE kanvas_user DROP COLUMN user_name;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE kanvas_user ADD COLUMN user_name TEXT;
UPDATE kanvas_user SET user_name = id::text;
ALTER TABLE kanvas_user ALTER COLUMN user_name SET NOT NULL;

COMMIT;
