-- Migration: ip-to-vat
-- Created at: 2022-11-15 19:23:55
-- ====  UP  ====

BEGIN;

CREATE TABLE vat (
    id SERIAL PRIMARY KEY,
    rate INT NOT NULL
);

CREATE TABLE country (
    id SERIAL PRIMARY KEY,
    country_short CHARACTER(2) UNIQUE NOT NULL,
    country_long CHARACTER varying(256) UNIQUE NOT NULL,
    vat_id INT REFERENCES vat(id)
);

CREATE TABLE ip_country (
    ip_from numeric(39,0) NOT NULL,
    ip_to numeric(39,0) NOT NULL,
    country_id INT REFERENCES country(id)
);

ALTER TABLE payment ADD COLUMN vat_rate DOUBLE PRECISION;
ALTER TABLE payment ADD COLUMN amount_excl_vat NUMERIC;
UPDATE payment
SET
  vat_rate = 0,
  amount_excl_vat = amount;
ALTER TABLE payment ALTER COLUMN vat_rate SET NOT NULL;
ALTER TABLE payment ALTER COLUMN amount_excl_vat SET NOT NULL;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE vat;
DROP TABLE country;
DROP TABLE ip_country;

COMMIT;
