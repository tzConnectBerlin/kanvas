-- Migration: marketing
-- Created at: 2022-11-14 12:56:30
-- ====  UP  ====

BEGIN;

CrEATE TABLE marketing (
  id SERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  consent BOOLEAN NOT NULL
);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE marketing;

COMMIT;
