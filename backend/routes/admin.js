const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

// GET /api/admin/orders
router.get('/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all();

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map(ord => ({
      ...ord,
      items: getItems.all(ord.id)
    }));

    res.json(enrichedOrders);
  } catch (error) {
    console.error('Admin fetch orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', (req, res) => {
  try {
    const { status, note, carrier, tracking_number } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // If changing to Cancelled from non-cancelled, restock products
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      const restock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      for (const item of items) {
        restock.run(item.quantity, item.product_id);
      }
    }

    // Update order
    db.prepare(`
      UPDATE orders 
      SET status = ?, 
          carrier = COALESCE(?, carrier),
          tracking_number = COALESCE(?, tracking_number),
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, carrier || null, tracking_number || null, req.params.id);

    // Add status history
    db.prepare(`
      INSERT INTO order_status_history (order_id, status, note)
      VALUES (?, ?, ?)
    `).run(req.params.id, status, note || `Status updated to ${status} by administrator.`);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ message: 'Order status updated successfully!', order: updated });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE status != 'Cancelled'
    `).get().revenue;

    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    
    const lowStockProducts = db.prepare(`
      SELECT id, name, stock, price, category 
      FROM products 
      WHERE stock <= 10 
      ORDER BY stock ASC 
      LIMIT 10
    `).all();

    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `).all();

    res.json({
      revenue: Number(totalRevenue.toFixed(2)),
      orders: totalOrders,
      users: totalUsers,
      products: totalProducts,
      lowStockProducts,
      ordersByStatus
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to compute dashboard stats.' });
  }
});

module.exports = router;
