/**
 * GET /api/orders/:id - Get single order
 * PUT /api/orders/:id - Update order
 * DELETE /api/orders/:id - Delete order
 * JavaScript version for Vercel compatibility
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { logAudit } = require('../utils/audit');
const { handleCors } = require('../utils/cors');

// GET /api/orders/:id
async function getOrder(req, res) {
  try {
    const user = requireAuth(req);
    const id = req.query.id;

    const orders = await query(
      `SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        m.entry_id as measurement_entry_id
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN measurements m ON o.measurement_id = m.id
       WHERE o.id = $1`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json(orders[0]);
  } catch (error) {
    console.error('Get order error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch order',
    });
  }
}

// PUT /api/orders/:id
async function updateOrder(req, res) {
  try {
    const user = requireAuth(req);
    const id = req.query.id;

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get existing order
    const existing = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const data = req.body;

    // Update order
    await query(
      `UPDATE orders SET
        fabric = COALESCE($1, fabric),
        status = COALESCE($2, status),
        delivery_date = COALESCE($3, delivery_date),
        notes = COALESCE($4, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        data.fabric,
        data.status,
        data.delivery_date,
        data.notes,
        id,
      ]
    );

    await logAudit(req, user.userId, 'update', 'order', id, { changes: Object.keys(data) });

    return res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Update order error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to update order',
    });
  }
}

// DELETE /api/orders/:id
async function deleteOrder(req, res) {
  try {
    const user = requireAuth(req);
    const id = req.query.id;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete orders' });
    }

    // Get existing order for logging
    const existing = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Delete order
    await query('DELETE FROM orders WHERE id = $1', [id]);

    await logAudit(req, user.userId, 'delete', 'order', id, { deleted: true });

    return res.status(200).json({
      message: 'Order deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    console.error('Delete order error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Failed to delete order',
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    if (req.method === 'GET') {
      return await getOrder(req, res);
    } else if (req.method === 'PUT') {
      return await updateOrder(req, res);
    } else if (req.method === 'DELETE') {
      return await deleteOrder(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Route handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    });
  }
};

