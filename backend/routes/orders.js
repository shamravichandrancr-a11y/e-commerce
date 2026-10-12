const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Helper: Generate tracking milestones based on order status and creation date
function getTrackingTimeline(order) {
  const steps = [
    {
      status: 'Ordered',
      title: 'Order Placed',
      description: `Order #${order.order_number} confirmed and verified.`,
      time: order.created_at,
      completed: true
    },
    {
      status: 'Processing',
      title: 'Processing & Packing',
      description: 'Items gathered, packaged and handed to courier partner.',
      time: order.status !== 'Pending' ? order.created_at : null,
      completed: ['Processing', 'Shipped', 'Delivered'].includes(order.status)
    },
    {
      status: 'Shipped',
      title: 'Dispatched & In Transit',
      description: `Carrier: ${order.carrier || 'Express Logistics'} (Tracking: ${order.tracking_number || 'TRK-' + order.order_number})`,
      time: ['Shipped', 'Delivered'].includes(order.status) ? order.updated_at : null,
      completed: ['Shipped', 'Delivered'].includes(order.status)
    },
    {
      status: 'Delivered',
      title: 'Delivered to Destination',
      description: `Delivered to ${order.shipping_address}, ${order.shipping_city}`,
      time: order.status === 'Delivered' ? order.updated_at : null,
      completed: order.status === 'Delivered'
    }
  ];

  if (order.status === 'Cancelled') {
    return [
      {
        status: 'Ordered',
        title: 'Order Placed',
        description: `Order #${order.order_number} placed.`,
        time: order.created_at,
        completed: true
      },
      {
        status: 'Cancelled',
        title: 'Order Cancelled',
        description: 'Order was cancelled. Payment refunded to original method.',
        time: order.updated_at,
        completed: true,
        isCancelled: true
      }
    ];
  }

  return steps;
}

// POST /api/orders (checkout / place order)
router.post('/', (req, res) => {
  const placeOrderTransaction = db.transaction((orderData) => {
    const {
      shipping_name,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_phone,
      payment_method = 'Credit Card'
    } = orderData;

    // Get user cart items
    const cartItems = db.prepare(`
      SELECT c.*, p.name, p.price, p.stock, p.image_url
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `).all(req.user.id);

    if (cartItems.length === 0) {
      throw new Error('Your cart is empty. Add products before checkout.');
    }

    // Verify stock availability
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        throw new Error(`Insufficient stock for "${item.name}". Only ${item.stock} left.`);
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Number((subtotal * 0.08).toFixed(2));
    const shippingFee = subtotal > 100 ? 0 : 9.99;
    const totalAmount = Number((subtotal + tax + shippingFee).toFixed(2));

    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = 'TRK' + Math.floor(10000000 + Math.random() * 90000000);
    const estimatedDelivery = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create Order
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, total_amount, subtotal, tax, shipping_fee,
        shipping_name, shipping_address, shipping_city, shipping_postal_code, shipping_phone,
        payment_method, payment_status, status, tracking_number, estimated_delivery
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing', ?, ?)
    `);

    const orderResult = insertOrder.run(
      orderNumber,
      req.user.id,
      totalAmount,
      subtotal,
      tax,
      shippingFee,
      shipping_name,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_phone,
      payment_method,
      'Paid',
      trackingNumber,
      estimatedDelivery
    );

    const orderId = orderResult.lastInsertRowid;

    // Insert Order Items and decrement product stock
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateStock = db.prepare(`
      UPDATE products SET stock = stock - ? WHERE id = ?
    `);

    for (const item of cartItems) {
      insertItem.run(orderId, item.product_id, item.name, item.price, item.quantity, item.image_url);
      updateStock.run(item.quantity, item.product_id);
    }

    // Insert initial status history
    db.prepare(`
      INSERT INTO order_status_history (order_id, status, note)
      VALUES (?, 'Processing', 'Order placed and payment authorized.')
    `).run(orderId);

    // Clear cart
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

    return { orderId, orderNumber, totalAmount, trackingNumber };
  });

  try {
    const {
      shipping_name,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_phone,
      payment_method
    } = req.body;

    if (!shipping_name || !shipping_address || !shipping_city || !shipping_postal_code) {
      return res.status(400).json({ error: 'Please provide full shipping details.' });
    }

    const order = placeOrderTransaction({
      shipping_name,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_phone: shipping_phone || 'N/A',
      payment_method
    });

    res.status(201).json({
      message: 'Order placed successfully!',
      order
    });
  } catch (error) {
    console.error('Order placement error:', error.message);
    res.status(400).json({ error: error.message || 'Failed to process order.' });
  }
});

// GET /api/orders (user's order history)
router.get('/', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');

    const ordersWithItems = orders.map(order => ({
      ...order,
      items: getItems.all(order.id),
      timeline: getTrackingTimeline(order)
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to fetch order history.' });
  }
});

// GET /api/orders/:id (track order)
router.get('/:id', (req, res) => {
  try {
    let order;
    if (req.user.role === 'admin') {
      order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(req.params.id, req.params.id);
    } else {
      order = db.prepare('SELECT * FROM orders WHERE (id = ? OR order_number = ?) AND user_id = ?').get(req.params.id, req.params.id, req.user.id);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);

    res.json({
      ...order,
      items,
      history,
      timeline: getTrackingTimeline(order)
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to fetch order tracking info.' });
  }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status === 'Delivered') {
      return res.status(400).json({ error: 'Cannot cancel an order that has already been delivered.' });
    }
    if (order.status === 'Cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled.' });
    }

    // Restore stock
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const restock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    for (const item of items) {
      restock.run(item.quantity, item.product_id);
    }

    db.prepare(`
      UPDATE orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(order.id);

    db.prepare(`
      INSERT INTO order_status_history (order_id, status, note)
      VALUES (?, 'Cancelled', 'Cancelled by customer.')
    `).run(order.id);

    res.json({ message: 'Order cancelled successfully and products restocked.' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
});

module.exports = router;
