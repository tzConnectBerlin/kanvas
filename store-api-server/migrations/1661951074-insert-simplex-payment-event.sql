-- Migration: insert-simplex-payment-event
-- Created at: 2022-08-31 16:04:34
-- ====  UP  ====

BEGIN;

CREATE TABLE simplex_payment_event (
    id SERIAL PRIMARY KEY,
    event_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    simplex_event_status TEXT NOT NULL,
    simplex_payment_status TEXT,
    partner_id TEXT,
    partner_end_user_id TEXT,
    crypto_currency TEXT,
    fiat_total_amount NUMERIC,
    fiat_total_amount_currency TEXT,
    crypto_total_amount NUMERIC,
    crypto_total_amount_currency TEXT,
    payment_created_at TIMESTAMP WITHOUT TIME ZONE,
    payment_updated_at TIMESTAMP WITHOUT TIME ZONE,
    event_timestamp TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX ON simplex_payment_event(event_id);
CREATE INDEX ON simplex_payment_event(payment_id);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE simplex_payment_event;

COMMIT;
