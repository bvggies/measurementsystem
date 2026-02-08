/**
 * GET /api/customers - List customers with pagination and filters
 * POST /api/customers - Create new customer
 * JavaScript version for Vercel compatibility
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { logAudit } = require('../utils/audit');

// GET /api/customers
async function getCustomers(req, res) {
  try {
    const user = requireAuth(req);

    const {
      page = '1',
      limit = '20',
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query || {};

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      whereConditions.push(
        `(c.name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Role-based filtering for tailors
    if (user.role === 'tailor') {
      // Tailors only see customers they've created measurements for
      whereConditions.push(
        `c.id IN (SELECT DISTINCT customer_id FROM measurements WHERE created_by = $${paramIndex} AND customer_id IS NOT NULL)`
      );
      params.push(user.userId);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Valid sort columns
    const validSortColumns = ['name', 'phone', 'email', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM customers c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count, 10);

    // Get customers with measurement count
    const customers = await query(
      `SELECT 
        c.*,
        COUNT(DISTINCT m.id) as measurement_count,
        MAX(m.created_at) as last_measurement_date
       FROM customers c
       LEFT JOIN measurements m ON c.id = m.customer_id
       WHERE ${whereClause}
       GROUP BY c.id
       ORDER BY ${sortColumn} ${sortDir}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      data: customers || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// POST /api/customers
async function createCustomer(req, res) {
  try {
    const user = requireAuth(req);

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { name, phone, email, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    // Check for duplicate phone or email
    if (phone || email) {
      const existing = await query(
        `SELECT id FROM customers 
         WHERE (phone = $1 AND $1 IS NOT NULL) 
            OR (email = $2 AND $2 IS NOT NULL AND $2 != '')
         LIMIT 1`,
        [phone, email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Customer with this phone or email already exists' });
      }
    }

    // Create customer
    const result = await query(
      `INSERT INTO customers (name, phone, email, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, phone || null, email || null, address || null]
    );

    await logAudit(req, user.userId, 'create', 'customer', result[0].id, { name });

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create customer error:', error);
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
    return getCustomers(req, res);
  } else if (req.method === 'POST') {
    return createCustomer(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

