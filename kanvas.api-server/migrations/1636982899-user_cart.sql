-- Migration: user_cart
-- Created at: 2021-11-15 14:28:19
-- ====  UP  ====

BEGIN;

-- bugfix:
-- fk on parent -> nft.id was wrong, parent column references an entry in
-- nft_category not in nft
ALTER TABLE nft_category DROP CONSTRAINT fk_nft;
ALTER TABLE nft_category ADD CONSTRAINT fk_parent FOREIGN KEY (parent) REFERENCES nft_category(id);

CREATE TABLE user_cart(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES kanvas_user(id),
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()+interval '1 hour'
);

CREATE TABLE mtm_user_cart_nft(
  user_cart_id INT NOT NULL REFERENCES user_cart(id) ON DELETE CASCADE,
  nft_id INT NOT NULL REFERENCES nft(id) ON DELETE CASCADE,

  PRIMARY KEY (user_cart_id, nft_id)
);

ALTER TABLE nft ALTER COLUMN editions_size SET DEFAULT 1;
UPDATE nft SET editions_size = COALESCE(editions_size, 1);
ALTER TABLE nft ALTER COLUMN editions_size SET NOT NULL;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft_category DROP CONSTRAINT fk_parent;
ALTER TABLE nft_category ADD CONSTRAINT fk_nft FOREIGN KEY (parent) REFERENCES nft(id);

DROP TABLE user_cart;
DROP TABLE mtm_user_cart_nft;

ALTER TABLE nft ALTER COLUMN editions_size DROP NOT NULL;
ALTER TABLE nft ALTER COLUMN editions_size DROP DEFAULT;

COMMIT;
