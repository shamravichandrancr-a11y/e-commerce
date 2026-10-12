const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'ecommerce.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrent reads
db.pragma('journal_mode = WAL');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 10,
      image_url TEXT NOT NULL,
      rating REAL DEFAULT 4.5,
      num_reviews INTEGER DEFAULT 12,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      shipping_fee REAL NOT NULL,
      shipping_name TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      shipping_city TEXT NOT NULL,
      shipping_postal_code TEXT NOT NULL,
      shipping_phone TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'Paid',
      status TEXT DEFAULT 'Processing' CHECK(status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
      tracking_number TEXT,
      carrier TEXT DEFAULT 'Express Logistics',
      estimated_delivery TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      image_url TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const adminPass = bcrypt.hashSync('admin123', 10);
    const userPass = bcrypt.hashSync('user123', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    insertUser.run('Admin Manager', 'admin@store.com', adminPass, 'admin');
    insertUser.run('Jane Customer', 'user@store.com', userPass, 'user');
    console.log('Seeded demo users (admin@store.com / admin123, user@store.com / user123)');
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (name, description, price, category, stock, image_url, rating, num_reviews)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const demoProducts = [
      {
        name: 'AeroSound Pro Wireless ANC Headphones',
        description: 'Industry-leading noise cancellation with spatial audio, 40-hour battery life, and plush memory foam earcups.',
        price: 199.99,
        category: 'Electronics',
        stock: 35,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
        rating: 4.8,
        num_reviews: 142
      },
      {
        name: 'QuantumFit Smartwatch Series 6',
        description: 'AMOLED always-on display, accurate heart rate and SpO2 tracking, GPS navigation, and 5ATM water resistance.',
        price: 149.50,
        category: 'Electronics',
        stock: 28,
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80',
        rating: 4.7,
        num_reviews: 89
      },
      {
        name: 'ErgoComfort Minimalist Backpack',
        description: 'Water-resistant coated canvas with dedicated 16-inch laptop compartment, ergonomic airflow back panel, and USB port.',
        price: 79.99,
        category: 'Accessories',
        stock: 50,
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80',
        rating: 4.6,
        num_reviews: 64
      },
      {
        name: 'Artisan Pour-Over Ceramic Coffee Maker',
        description: 'Handcrafted stoneware ceramic dripper with thermal insulated double-wall carafe and precision stainless steel filter.',
        price: 45.00,
        category: 'Home & Kitchen',
        stock: 22,
        image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=700&auto=format&fit=crop&q=80',
        rating: 4.9,
        num_reviews: 110
      },
      {
        name: 'Classic Mechanical Keyboard RGB',
        description: 'Hot-swappable tactile switches, sound-dampening foam, per-key RGB illumination, and durable PBT keycaps.',
        price: 119.00,
        category: 'Electronics',
        stock: 19,
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80',
        rating: 4.8,
        num_reviews: 204
      },
      {
        name: 'Urban Luxe Polarized Sunglasses',
        description: 'Lightweight titanium frame with anti-reflective UV400 polarized lenses for crystal-clear clarity and style.',
        price: 65.00,
        category: 'Fashion',
        stock: 40,
        image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700&auto=format&fit=crop&q=80',
        rating: 4.5,
        num_reviews: 47
      },
      {
        name: 'Nordic Ceramic Table Lamp',
        description: 'Warm ambient LED light with touch 3-step dimming, textured matte ceramic base, and natural linen shade.',
        price: 89.95,
        category: 'Home & Kitchen',
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&auto=format&fit=crop&q=80',
        rating: 4.7,
        num_reviews: 38
      },
      {
        name: 'PeakPerformance Trail Running Shoes',
        description: 'Engineered mesh upper with responsive carbon-infused foam cushioning and high-traction Vibram rubber outsole.',
        price: 135.00,
        category: 'Fashion',
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80',
        rating: 4.9,
        num_reviews: 312
      }
    ];

    for (const p of demoProducts) {
      insertProduct.run(p.name, p.description, p.price, p.category, p.stock, p.image_url, p.rating, p.num_reviews);
    }
    console.log('Seeded demo products across Electronics, Fashion, Home & Kitchen, Accessories');
  }
}

initDb();

module.exports = db;
