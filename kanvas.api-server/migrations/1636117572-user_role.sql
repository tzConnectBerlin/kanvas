-- Migration: role
-- Created at: 2021-11-05 14:06:12
-- ====  UP  ====

BEGIN;
CREATE TABLE user_role (
       id SERIAL PRIMARY KEY,
       role_label TEXT UNIQUE NOT NULL
);
COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE user_role;
COMMIT;
