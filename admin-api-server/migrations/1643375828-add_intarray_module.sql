-- Migration: add_intarray_module
-- Created at: 2022-01-28 14:17:08
-- ====  UP  ====

BEGIN;

CREATE EXTENSION intarray;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP EXTENSION intarray;

COMMIT;
