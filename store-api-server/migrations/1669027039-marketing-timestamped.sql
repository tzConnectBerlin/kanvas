-- Migration: marketing-timestamped
-- Created at: 2022-11-21 11:37:19
-- ====  UP  ====

BEGIN;

ALTER TABLE marketing ADD COLUMN created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC');

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE marketing DROP COLUMN created_at;

COMMIT;
