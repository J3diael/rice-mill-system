-- Sample data so the system has something to show on first run.
-- Safe to run more than once.

INSERT INTO raw_materials (name, quantity, unit, reorder_level) VALUES
  ('Palay (unmilled rice)', 5000, 'kg', 1000),
  ('Empty sacks (25 kg)',   300,  'pcs', 100),
  ('Diesel',                80,   'L',   40)
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, unit, weight_kg, price, stock, reorder_level) VALUES
  ('Regular milled rice (25 kg)', 'sack', 25,   1150, 40, 10),
  ('Premium milled rice (25 kg)', 'sack', 25,   1350, 25, 10),
  ('Regular milled rice (per kg)', 'kg',  1,    48,   100, 50),
  ('Rice bran / darak (50 kg)',   'sack', 50,   650,  15, 5)
ON CONFLICT (name) DO NOTHING;
