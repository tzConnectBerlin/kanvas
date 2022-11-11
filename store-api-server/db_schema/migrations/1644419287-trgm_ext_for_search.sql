-- Migration: trgm_ext_for_search
-- Created at: 2022-02-09 16:08:07
-- ====  UP  ====

BEGIN;

CREATE EXTENSION pg_trgm;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP EXTENSION pg_trgm;

COMMIT;
