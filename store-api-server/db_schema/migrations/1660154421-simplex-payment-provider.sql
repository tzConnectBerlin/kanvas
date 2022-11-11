-- Migration: simplex-payment-provider
-- Created at: 2022-08-10 21:00:21
-- ====  UP  ====

BEGIN;

ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'simplex';


COMMIT;

-- ==== DOWN ====

BEGIN;

COMMIT;
