-- Migration: payment-promised-status
-- Created at: 2022-06-09 18:27:00
-- ====  UP  ====

BEGIN;

ALTER TABLE payment DROP COLUMN fulfillment_promised_deadline;
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'promised';

COMMIT;

-- ==== DOWN ====

BEGIN;

UPDATE payment
SET status = 'created'
WHERE status = 'promised';

ALTER TABLE payment ADD COLUMN fulfillment_promised_deadline TIMESTAMP WITHOUT TIME ZONE;

COMMIT;
