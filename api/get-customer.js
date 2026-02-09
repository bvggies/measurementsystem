/**
 * GET /api/get-customer?id=xxx
 * Fetch a single customer by id (UUID).
 * Static route for Vercel so we always get JSON (avoids dynamic [id] routing issues).
 */

const { query } = require('./utils/db');
const { requireAuth } = require('./utils/auth');
const { handleCors } = require('./utils/cors');

async function getCustomer(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const user = requireAuth(req);
    const id = (req.query && req.query.id) ? String(req.query.id).trim() : null;
    if (!id) {
      return res.status(400).end(JSON.stringify({ error: 'Customer ID is required' }));
    }

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
      return res.status(404).end(JSON.stringify({ error: 'Customer not found' }));
    }

    const customer = customers[0];

    if (user.role === 'tailor') {
      const tailorMeasurements = await query(
        'SELECT COUNT(*) as count FROM measurements WHERE customer_id = $1 AND created_by = $2',
        [id, user.userId]
      );
      if (parseInt(tailorMeasurements[0].count, 10) === 0) {
        return res.status(403).end(JSON.stringify({ error: 'Access denied' }));
      }
    }

    const measurements = await query(
      `SELECT m.id, m.entry_id, m.created_at, m.units, u.name as created_by_name
       FROM measurements m
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.customer_id = $1
       ORDER BY m.created_at DESC
       LIMIT 10`,
      [id]
    );

    const orders = await query(
      `SELECT o.id, o.status, o.delivery_date, o.created_at
       FROM orders o
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [id]
    );

    const fittings = await query(
      `SELECT f.id, f.scheduled_at, f.status, f.notes, u.name as tailor_name
       FROM fittings f
       LEFT JOIN users u ON f.tailor_id = u.id
       WHERE f.customer_id = $1 AND f.scheduled_at >= NOW()
       ORDER BY f.scheduled_at ASC
       LIMIT 10`,
      [id]
    );

    const payload = {
      ...customer,
      measurements: measurements || [],
      orders: orders || [],
      fittings: fittings || [],
    };
    res.status(200);
    return res.end(JSON.stringify(payload));
  } catch (error) {
    console.error('Get customer error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).end(JSON.stringify({ error: error.message }));
    }
    return res.status(500).end(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }));
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') {
    return getCustomer(req, res);
  }
  res.setHeader('Content-Type', 'application/json');
  return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
};
