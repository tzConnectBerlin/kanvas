-- Migration: payment-promise
-- Created at: 2022-05-27 21:57:23
-- ====  UP  ====

BEGIN;

ALTER TABLE payment ADD COLUMN fulfillment_promised_deadline TIMESTAMP WITHOUT TIME ZONE;
CREATE INDEX ON payment(fulfillment_promised_deadline);

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE payment DROP COLUMN fulfillment_promised_deadline;

COMMIT;
