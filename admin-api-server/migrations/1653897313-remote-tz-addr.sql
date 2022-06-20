-- Migration: remote-tz-addr
-- Created at: 2022-05-30 09:55:13
-- ====  UP  ====

BEGIN;

ALTER TABLE kanvas_user DROP COLUMN address;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE kanvas_user ADD COLUMN address TEXT;
UPDATE kanvas_user SET address = id::text;
ALTER TABLE kanvas_user ALTER COLUMN address SET NOT NULL;

COMMIT;
