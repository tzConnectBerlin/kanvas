-- Migration: uniq_username
-- Created at: 2021-11-29 12:10:15
-- ====  UP  ====

BEGIN;

CREATE UNIQUE INDEX ON kanvas_user(user_name);

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP INDEX kanvas_user_user_name_idx;

COMMIT;
