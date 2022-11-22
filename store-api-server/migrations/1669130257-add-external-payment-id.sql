-- Migration: add-external-payment-id
-- Created at: 2022-11-22 16:17:37
-- ====  UP  ====

BEGIN;

ALTER TABLE payment ADD COLUMN external_payment_id TEXT;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE payment DROP COLUMN external_payment_id TEXT;

COMMIT;
