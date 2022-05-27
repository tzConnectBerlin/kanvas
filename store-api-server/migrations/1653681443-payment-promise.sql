-- Migration: payment-promise
-- Created at: 2022-05-27 21:57:23
-- ====  UP  ====

BEGIN;

ALTER TABLE payment ADD COLUMN promised_deadline TIMESTAMP WITHOUT TIME ZONE;
CREATE INDEX ON payment(promised_deadline);

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE payment DROP COLUMN promised_deadline;

COMMIT;
