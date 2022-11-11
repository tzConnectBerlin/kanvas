-- Migration: tezpay
-- Created at: 2022-04-25 16:04:10
-- ====  UP  ====

BEGIN;

ALTER TYPE payment_provider RENAME VALUE 'tezos' TO 'tezpay';

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TYPE payment_provider RENAME VALUE 'tezpay' TO 'tezos';

COMMIT;
