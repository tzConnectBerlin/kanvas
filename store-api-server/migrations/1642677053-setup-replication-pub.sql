-- Migration: setup-replication-pub
-- Created at: 2022-01-20 12:10:53
-- ====  UP  ====

BEGIN;

CREATE PUBLICATION kanvas_pub FOR ALL TABLES;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP PUBLICATION kanvas_pub;

COMMIT;
