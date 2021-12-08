-- Migration: search
-- Created at: 2021-11-29 13:08:24
-- ====  UP  ====

BEGIN;

CREATE EXTENSION pg_trgm;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP EXTENSION pg_trgm;

COMMIT;
