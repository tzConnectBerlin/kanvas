-- Migration: kanvas_user
-- Created at: 2021-11-05 14:07:59
-- ====  UP  ====

BEGIN;
-- mtm = many to many
CREATE TABLE kanvas_user (
       kanvas_user_id SERIAL PRIMARY KEY,
       user_name TEXT NOT NULL,
       address TEXT,
       signed_payload TEXT
);
CREATE TABLE mtm_kanvas_user_user_role (
       kanvas_user_id INT REFERENCES kanvas_user(kanvas_user_id) ON UPDATE CASCADE ON DELETE CASCADE,
       user_role_id INT REFERENCES user_role(user_role_id) ON UPDATE CASCADE ON DELETE CASCADE,
);
COMMIT;

-- ==== DOWN ====

BEGIN;
DROP TABLE kanvas_user;
DROP TABLE mtm_kanvas_user_user_role;
COMMIT;
