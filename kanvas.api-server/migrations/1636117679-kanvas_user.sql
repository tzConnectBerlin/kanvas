-- Migration: kanvas_user
-- Created at: 2021-11-05 14:07:59
-- ====  UP  ====

BEGIN;
-- mtm = many to many
CREATE TABLE mtm_kanvas_user_user_role (
       kanvas_user_id INT NOT NULL,
       user_role_id INT NOT NULL
);
CREATE TABLE kanvas_user (
       id SERIAL PRIMARY KEY,
       user_name TEXT NOT NULL,
       adress TEXT,
       signedPayload TEXT
);
COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE mtm_kanvas_user_user_role;
DROP TABLE kanvas_user;
COMMIT;
