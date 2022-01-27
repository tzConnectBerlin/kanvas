-- Migration: remove_user_roles
-- Created at: 2022-01-27 15:35:05
-- ====  UP  ====

BEGIN;

ALTER PUBLICATION store_pub DROP TABLE mtm_kanvas_user_user_role, user_role;

DROP TABLE mtm_kanvas_user_user_role;
DROP TABLE user_role;

COMMIT;

-- ==== DOWN ====

BEGIN;

CREATE TABLE user_role (
  id SERIAL PRIMARY KEY,
  role_label TEXT UNIQUE NOT NULL
);
CREATE TABLE mtm_kanvas_user_user_role (
  id SERIAL PRIMARY KEY,
  kanvas_user_id INT REFERENCES kanvas_user(id) ON UPDATE CASCADE ON DELETE CASCADE,
  user_role_id INT REFERENCES user_role(id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER PUBLICATION store_pub ADD TABLE mtm_kanvas_user_user_role, user_role;

COMMIT;
