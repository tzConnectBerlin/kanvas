-- Migration: test_table
-- Created at: 2021-11-05 11:55:29
-- ====  UP  ====

BEGIN;
CREATE TABLE my_test_table();
COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE my_test_table;
COMMIT;
