-- Migration: user
-- Created at: 2021-11-19 09:41:49
-- ====  UP  ====
-- The same as in the other app

BEGIN;
-- mtm = many to many
CREATE TABLE kanvas_user (
       id SERIAL PRIMARY KEY,
       email TEXT UNIQUE NOT NULL,
       user_name TEXT,
       address TEXT UNIQUE NOT NULL,
       password TEXT UNIQUE NOT NULL,
       disabled boolean DEFAULT false
);
CREATE TABLE user_role (
       id SERIAL PRIMARY KEY,
       role_label TEXT UNIQUE NOT NULL
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
