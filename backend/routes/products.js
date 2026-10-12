const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/products/categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category ASC').all();
    res.json(categories.map(c => c.category));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// GET /api/products
router.get('/', (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sortBy, order } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      query += ' AND price >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      query += ' AND price <= ?';
      params.push(Number(maxPrice));
    }

    // Sorting
    const sortFieldMap = {
      price: 'price',
      rating: 'rating',
      name: 'name',
      created_at: 'created_at'
    };

    const sortField = sortFieldMap[sortBy] || 'created_at';
    const sortDirection = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortField} ${sortDirection}`;

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product details.' });
  }
});

// POST /api/products (Admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, description, price, category, stock, image_url, rating } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required.' });
    }

    const img = image_url && image_url.trim() !== '' 
      ? image_url.trim() 
      : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=700&auto=format&fit=crop&q=80';

    const insert = db.prepare(`
      INSERT INTO products (name, description, price, category, stock, image_url, rating, num_reviews)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      description ? description.trim() : '',
      parseFloat(price),
      category.trim(),
      parseInt(stock) || 0,
      img,
      parseFloat(rating) || 5.0,
      0
    );

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Product created successfully!', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// PUT /api/products/:id (Admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, description, price, category, stock, image_url, rating } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const update = db.prepare(`
      UPDATE products
      SET name = ?, description = ?, price = ?, category = ?, stock = ?, image_url = ?, rating = ?
      WHERE id = ?
    `);

    update.run(
      name !== undefined ? name.trim() : existing.name,
      description !== undefined ? description.trim() : existing.description,
      price !== undefined ? parseFloat(price) : existing.price,
      category !== undefined ? category.trim() : existing.category,
      stock !== undefined ? parseInt(stock) : existing.stock,
      image_url !== undefined && image_url.trim() !== '' ? image_url.trim() : existing.image_url,
      rating !== undefined ? parseFloat(rating) : existing.rating,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ message: 'Product updated successfully!', product: updated });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted successfully!' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

module.exports = router;
