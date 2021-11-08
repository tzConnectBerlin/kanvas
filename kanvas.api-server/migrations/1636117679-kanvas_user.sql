-- Migration: kanvas_user
-- Created at: 2021-11-05 14:07:59
-- ====  UP  ====

BEGIN;
-- mtm = many to many
CREATE TABLE kanvas_user (
       id SERIAL PRIMARY KEY,
       user_name TEXT,
       address TEXT UNIQUE NOT NULL,
       signed_payload TEXT
);
CREATE TABLE mtm_kanvas_user_user_role (
       kanvas_user_id INT REFERENCES kanvas_user(id) ON UPDATE CASCADE ON DELETE CASCADE,
       user_role_id INT REFERENCES user_role(id) ON UPDATE CASCADE ON DELETE CASCADE
);
COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE kanvas_user;
DROP TABLE mtm_kanvas_user_user_role;
COMMIT;
