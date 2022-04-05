insert into nft_category (
  category, description
)
values
  ('Fine Art', 'A collection of fine art devided in several categories'),
  ('Visual Art', 'Not actually visual'),
  ('Applied Art', 'Not actually visual');

insert into nft_category (
  category, description, parent
)
values
  ('Drawing', 'Sub fine art category', 1),
  ('Painting', 'Sub fine art category', 1),
  ('Sculpture', 'Sub fine art category', 1),
  ('Digital', 'Sub visual art category', 2),
  ('Photography', 'Sub visual art category', 2),
  ('Abstract', 'Sub photography category', 8),
  ('Landscape', 'Sub photography category', 8),
  ('Portrait', 'Sub photography category', 8),
  ('Cities', 'Sub photography category', 8),
  ('Honk Kong', 'Sub cities category', 12),
  ('Toronto', 'Sub cities category', 12),
  ('London', 'Sub cities category', 12),
  ('Black & White', 'Sub photography category', 8);
