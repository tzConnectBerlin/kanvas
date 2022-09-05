-- Migration: insert-simplex-payment-event-json
-- Created at: 2022-09-05 11:05:15
-- ====  UP  ====

BEGIN;

CREATE TABLE simplex_payment_event (
	id serial PRIMARY KEY,
	payment_id TEXT NOT NULL,
	data JSONB NOT NULL
);

CREATE INDEX ON simplex_payment_event(payment_id);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE simplex_payment_event;

COMMIT;
