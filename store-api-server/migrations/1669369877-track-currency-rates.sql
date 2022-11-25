-- Migration: track-currency-rates
-- Created at: 2022-11-25 10:51:17
-- ====  UP  ====

BEGIN;

CREATE TABLE currency_rate (
  id SERIAL NOT NULL,
  at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
  currency TEXT NOT NULL,
  rate DOUBLE PRECISION NOT NULL,

  PRIMARY KEY (at, currency)
);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE currency_rate;

COMMIT;
