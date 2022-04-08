-- Migration: add-vat
-- Created at: 2022-02-21 11:10:50
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

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE vat;
DROP TABLE country;
DROP TABLE ip_country;

COMMIT;
