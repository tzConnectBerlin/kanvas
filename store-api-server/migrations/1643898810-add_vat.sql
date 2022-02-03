-- Migration: add_vat
-- Created at: 2022-02-03 15:33:30
-- ====  UP  ====

BEGIN;

CREATE TABLE vat (
    id SERIAL PRIMARY KEY,
    rate INT NOT NULL
);

CREATE TABLE country (
    id SERIAL PRIMARY KEY,
    country_short CHARACTER(2) NOT NULL,
    country_long CHARACTER varying(256) NOT NULL,
    vat_id INT REFERENCES vat(id)
);

CREATE TABLE ip_country (
    ip_from numeric(39,0) NOT NULL,
    ip_to numeric(39,0) NOT NULL,
    country_id INT REFERENCES country(id)
);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE vat;
DROP TABLE country;
DROP TABLE ip_country;

COMMIT;
