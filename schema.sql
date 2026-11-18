CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'new',
  price INTEGER NOT NULL DEFAULT 0,
  old_price INTEGER,
  condition_text TEXT DEFAULT '',
  ram TEXT DEFAULT '',
  storage TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image1 TEXT DEFAULT '',
  image2 TEXT DEFAULT '',
  image3 TEXT DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  product_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
  note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

INSERT OR IGNORE INTO categories (id, name, slug) VALUES
('cat-new', 'নতুন মোবাইল', 'new'),
('cat-used', 'পুরাতন মোবাইল', 'used');

INSERT OR IGNORE INTO brands (id, name) VALUES
('b-apple', 'Apple'), ('b-samsung', 'Samsung'), ('b-xiaomi', 'Xiaomi'),
('b-vivo', 'Vivo'), ('b-oppo', 'Oppo'), ('b-realme', 'Realme'),
('b-tecno', 'Tecno'), ('b-infinix', 'Infinix'), ('b-oneplus', 'OnePlus');

INSERT OR IGNORE INTO settings (key, value) VALUES
('shop_name', 'RASEL MOBILE ZOON'),
('phone', '01788102096'),
('whatsapp', '01788102096'),
('banner', ''),
('logo', ''),
('notice', 'নতুন ও পুরাতন মোবাইলের সেরা কালেকশন');
