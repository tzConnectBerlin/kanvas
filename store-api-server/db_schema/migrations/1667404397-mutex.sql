-- Migration: mutex
-- Created at: 2022-11-02 16:53:17
-- ====  UP  ====

BEGIN;

CREATE TABLE mutex (
  id SERIAL NOT NULL,
  name TEXT PRIMARY KEY
);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP TABLE mutex;

COMMIT;
