-- Rice Mill Management System: database schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Raw materials: palay (unmilled rice), sacks, fuel, etc.
CREATE TABLE IF NOT EXISTS raw_materials (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  quantity      NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit          TEXT NOT NULL,
  reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Every stock movement of a raw material (stock in, usage, milling)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id          SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES raw_materials(id),
  type        TEXT NOT NULL CHECK (type IN ('ADD', 'USE')),
  quantity    NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  note        TEXT,
  user_id     INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Finished goods sold at the counter: milled rice, bran (darak), etc.
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  unit          TEXT NOT NULL,
  weight_kg     NUMERIC(10, 2) CHECK (weight_kg IS NULL OR weight_kg > 0),
  price         NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock         NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A milling run: raw material in, finished product out
CREATE TABLE IF NOT EXISTS milling_batches (
  id             SERIAL PRIMARY KEY,
  material_id    INTEGER NOT NULL REFERENCES raw_materials(id),
  input_qty      NUMERIC(12, 2) NOT NULL CHECK (input_qty > 0),
  product_id     INTEGER NOT NULL REFERENCES products(id),
  output_qty     NUMERIC(12, 2) NOT NULL CHECK (output_qty > 0),
  recovery_rate  NUMERIC(5, 2),  -- % of input weight recovered as product, when both are in kg
  notes          TEXT,
  user_id        INTEGER REFERENCES users(id),
  milled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Point of sale
CREATE TABLE IF NOT EXISTS sales (
  id             SERIAL PRIMARY KEY,
  customer_name  TEXT,
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'GCASH', 'CREDIT')),
  total          NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  amount_paid    NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  user_id        INTEGER REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id          SERIAL PRIMARY KEY,
  sale_id     INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  quantity    NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal    NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_created ON inventory_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_milling_milled ON milling_batches (milled_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id);
