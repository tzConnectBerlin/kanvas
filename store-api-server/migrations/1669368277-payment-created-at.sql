-- Migration: payment-created-at
-- Created at: 2022-11-25 10:24:37
-- ====  UP  ====

BEGIN;

ALTER TABLE payment ADD COLUMN created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC');

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE payment DROP COLUMN created_at;

COMMIT;
