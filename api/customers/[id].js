/**
 * GET /api/customers/:id - Get single customer
 * PUT /api/customers/:id - Update customer
 * DELETE /api/customers/:id - Delete customer
 * JavaScript version for Vercel compatibility
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');

// GET /api/customers/:id
async function getCustomer(req, res) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;

    const customers = await query(
      `SELECT 
        c.*,
        COUNT(DISTINCT m.id) as measurement_count,
        COUNT(DISTINCT o.id) as order_count,
        COUNT(DISTINCT f.id) as fitting_count
       FROM customers c
       LEFT JOIN measurements m ON c.id = m.customer_id
       LEFT JOIN orders o ON c.id = o.customer_id
       LEFT JOIN fittings f ON c.id = f.customer_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers[0];

    // Role-based access control
    if (user.role === 'tailor') {
      // Check if tailor has created measurements for this customer
      const tailorMeasurements = await query(
        'SELECT COUNT(*) as count FROM measurements WHERE customer_id = $1 AND created_by = $2',
        [id, user.userId]
      );
      if (parseInt(tailorMeasurements[0].count, 10) === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get recent measurements
    const measurements = await query(
      `SELECT m.id, m.entry_id, m.created_at, m.units, u.name as created_by_name
       FROM measurements m
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.customer_id = $1
       ORDER BY m.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Get recent orders
    const orders = await query(
      `SELECT o.id, o.status, o.delivery_date, o.created_at
       FROM orders o
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Get upcoming fittings
    const fittings = await query(
      `SELECT f.id, f.scheduled_at, f.status, f.notes, u.name as tailor_name
       FROM fittings f
       LEFT JOIN users u ON f.tailor_id = u.id
       WHERE f.customer_id = $1 AND f.scheduled_at >= NOW()
       ORDER BY f.scheduled_at ASC
       LIMIT 10`,
      [id]
    );

    return res.status(200).json({
      ...customer,
      measurements: measurements || [],
      orders: orders || [],
      fittings: fittings || [],
    });
  } catch (error) {
    console.error('Get customer error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// PUT /api/customers/:id
async function updateCustomer(req, res) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get existing customer
    const existing = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Role-based access control for tailors
    if (user.role === 'tailor') {
      const tailorMeasurements = await query(
        'SELECT COUNT(*) as count FROM measurements WHERE customer_id = $1 AND created_by = $2',
        [id, user.userId]
      );
      if (parseInt(tailorMeasurements[0].count, 10) === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { name, phone, email, address } = req.body;

    // Check for duplicate phone or email (excluding current customer)
    if (phone || email) {
      const existing = await query(
        `SELECT id FROM customers 
         WHERE id != $1
           AND ((phone = $2 AND $2 IS NOT NULL) 
            OR (email = $3 AND $3 IS NOT NULL AND $3 != ''))
         LIMIT 1`,
        [id, phone, email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Customer with this phone or email already exists' });
      }
    }

    // Update customer
    const result = await query(
      `UPDATE customers 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, phone, email, address, id]
    );

    // Log activity
    try {
      await query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, 'update', 'customer', $2, $3)`,
        [user.userId, id, JSON.stringify({ changes: Object.keys(req.body) })]
      );
    } catch (err) {
      console.log('Could not log activity:', err.message);
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// DELETE /api/customers/:id
async function deleteCustomer(req, res) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete customers' });
    }

    const existing = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has measurements or orders
    const measurements = await query('SELECT COUNT(*) as count FROM measurements WHERE customer_id = $1', [id]);
    const orders = await query('SELECT COUNT(*) as count FROM orders WHERE customer_id = $1', [id]);

    if (parseInt(measurements[0].count, 10) > 0 || parseInt(orders[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with existing measurements or orders',
      });
    }

    await query('DELETE FROM customers WHERE id = $1', [id]);

    // Log activity
    try {
      await query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, 'delete', 'customer', $2, $3)`,
        [user.userId, id, JSON.stringify({ name: existing[0].name })]
      );
    } catch (err) {
      console.log('Could not log activity:', err.message);
    }

    return res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return getCustomer(req, res);
  } else if (req.method === 'PUT') {
    return updateCustomer(req, res);
  } else if (req.method === 'DELETE') {
    return deleteCustomer(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

