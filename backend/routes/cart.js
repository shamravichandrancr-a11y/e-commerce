const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/cart
router.get('/', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT 
        c.id,
        c.product_id,
        c.quantity,
        p.name,
        p.price,
        p.image_url,
        p.stock,
        p.category,
        (p.price * c.quantity) as total_price
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal > 100 || items.length === 0 ? 0 : 9.99;
    const total = Number((subtotal + tax + shipping).toFixed(2));

    res.json({
      items,
      summary: {
        itemCount: items.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: Number(subtotal.toFixed(2)),
        tax,
        shippingFee: shipping,
        total
      }
    });
  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

// POST /api/cart (add product)
router.post('/', (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    const qty = Math.max(1, parseInt(quantity) || 1);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (product.stock < qty) {
      return res.status(400).json({ error: `Only ${product.stock} units available in stock.` });
    }

    const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({ error: `Cannot add more than available stock (${product.stock}).` });
      }
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, qty);
    }

    res.json({ message: 'Cart updated successfully!' });
  } catch (error) {
    console.error('Add cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
});

// PUT /api/cart/:id (update quantity)
router.put('/:id', (req, res) => {
  try {
    const { quantity } = req.body;
    const newQty = parseInt(quantity);

    if (isNaN(newQty) || newQty <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
      return res.json({ message: 'Item removed from cart.' });
    }

    const item = db.prepare(`
      SELECT c.*, p.stock 
      FROM cart_items c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.id = ? AND c.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    if (newQty > item.stock) {
      return res.status(400).json({ error: `Only ${item.stock} units currently available.` });
    }

    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?').run(newQty, req.params.id, req.user.id);
    res.json({ message: 'Quantity updated successfully!' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart item.' });
  }
});

// DELETE /api/cart/:id (remove single item)
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Item removed from cart.' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Failed to delete cart item.' });
  }
});

// DELETE /api/cart (clear entire cart)
router.delete('/', (req, res) => {
  try {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'Cart cleared successfully.' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
});

module.exports = router;
