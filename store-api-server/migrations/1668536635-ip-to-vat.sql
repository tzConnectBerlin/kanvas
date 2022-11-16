-- Migration: ip-to-vat
-- Created at: 2022-11-15 19:23:55
-- ====  UP  ====

BEGIN;

CREATE TABLE vat (
    id SERIAL UNIQUE NOT NULL,
    percentage INT PRIMARY KEY
);

CREATE TABLE country (
    id SERIAL PRIMARY KEY,
    country_short CHARACTER(2) UNIQUE NOT NULL,
    country_long CHARACTER varying(256) UNIQUE NOT NULL,
    vat_id INT REFERENCES vat(id)
);

INSERT INTO vat (percentage) VALUES (5);

INSERT INTO country (country_short, country_long, vat_id)
SELECT 'GB', 'Great Britain', (SELECT id FROM vat);

CREATE TABLE ip_country (
    ip_from numeric(39,0) NOT NULL,
    ip_to numeric(39,0) NOT NULL,
    country_id INT REFERENCES country(id)
);

ALTER TABLE payment ADD COLUMN vat_rate DOUBLE PRECISION;
ALTER TABLE payment ADD COLUMN amount_excl_vat NUMERIC;
ALTER TABLE payment ADD COLUMN client_ip text;
UPDATE payment
SET
  vat_rate = 0,
  amount_excl_vat = amount,
  client_ip = 'unknown; pre migration';
ALTER TABLE payment ALTER COLUMN vat_rate SET NOT NULL;
ALTER TABLE payment ALTER COLUMN amount_excl_vat SET NOT NULL;
ALTER TABLE payment ALTER COLUMN client_ip SET NOT NULL;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE vat;
DROP TABLE country;
DROP TABLE ip_country;

ALTER TABLE payment DROP COLUMN vat_rate;
ALTER TABLE payment DROP COLUMN amount-excl_vat;
ALTER TABLE payment DROP COLUMN client_ip;

COMMIT;
