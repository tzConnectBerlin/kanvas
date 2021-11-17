-- Migration: cart_session
-- Created at: 2021-11-15 14:28:19
-- ====  UP  ====

BEGIN;

-- bugfix:
-- fk on parent -> nft.id was wrong, parent column references an entry in
-- nft_category not in nft
ALTER TABLE nft_category DROP CONSTRAINT fk_nft;
ALTER TABLE nft_category ADD CONSTRAINT fk_parent FOREIGN KEY (parent) REFERENCES nft_category(id);

CREATE TABLE cart_session(
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()+interval '1 hour'
);

ALTER TABLE kanvas_user ADD COLUMN cart_session UUID REFERENCES cart_session(session_id) ON DELETE SET NULL;

create table mtm_cart_session_nft(
  cart_session_id int not null references cart_session(id) on delete cascade,
  nft_id int not null references nft(id) on delete cascade,

  primary key (cart_session_id, nft_id)
);

ALTER TABLE nft ALTER COLUMN editions_size SET DEFAULT 1;
UPDATE nft SET editions_size = COALESCE(editions_size, 1);
ALTER TABLE nft ALTER COLUMN editions_size SET NOT NULL;

COMMIT;

-- ==== DOWN ====

BEGIN;

ALTER TABLE nft_category DROP CONSTRAINT fk_parent;
ALTER TABLE nft_category ADD CONSTRAINT fk_nft FOREIGN KEY (parent) REFERENCES nft(id);

DROP TABLE cart_session;
DROP TABLE mtm_cart_session_nft;

ALTER TABLE nft ALTER COLUMN editions_size DROP NOT NULL;
ALTER TABLE nft ALTER COLUMN editions_size DROP DEFAULT;

COMMIT;
