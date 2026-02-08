/**
 * GET /api/orders - List orders with pagination and filters
 * POST /api/orders - Create new order
 * JavaScript version for Vercel compatibility
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { logAudit } = require('../utils/audit');

// GET /api/orders
async function getOrders(req, res) {
  try {
    const user = requireAuth(req);

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (req.query.search) {
      conditions.push(`(c.name ILIKE $${paramIndex} OR m.entry_id ILIKE $${paramIndex})`);
      params.push(`%${req.query.search}%`);
      paramIndex++;
    }

    if (req.query.status) {
      conditions.push(`o.status = $${paramIndex++}`);
      params.push(req.query.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN measurements m ON o.measurement_id = m.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    // Get orders
    params.push(limit, offset);
    const orders = await query(
      `SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        m.entry_id as measurement_entry_id
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN measurements m ON o.measurement_id = m.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return res.status(200).json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch orders',
    });
  }
}

// POST /api/orders
async function createOrder(req, res) {
  try {
    const user = requireAuth(req);

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const data = req.body;

    // Validate required fields
    if (!data.measurement_id && !data.customer_id) {
      return res.status(400).json({
        error: 'Either measurement_id or customer_id is required',
      });
    }

    // If measurement_id is provided, get customer_id from measurement
    let customerId = data.customer_id;
    if (data.measurement_id && !customerId) {
      const measurement = await query('SELECT customer_id FROM measurements WHERE id = $1', [data.measurement_id]);
      if (measurement.length > 0) {
        customerId = measurement[0].customer_id;
      }
    }

    // Create order
    const result = await query(
      `INSERT INTO orders (measurement_id, customer_id, fabric, status, delivery_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        data.measurement_id || null,
        customerId || null,
        data.fabric || null,
        data.status || 'raw',
        data.delivery_date || null,
        data.notes || null,
      ]
    );

    await logAudit(req, user.userId, 'create', 'order', result[0].id, { status: data.status || 'raw' });

    return res.status(201).json({
      id: result[0].id,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Create order error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Failed to create order',
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      return await getOrders(req, res);
    } else if (req.method === 'POST') {
      return await createOrder(req, res);
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

