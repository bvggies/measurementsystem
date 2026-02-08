/**
 * GET /api/fittings - List fittings with pagination and filters
 * POST /api/fittings - Create new fitting
 * JavaScript version for Vercel compatibility
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { logAudit } = require('../utils/audit');

// GET /api/fittings
async function getFittings(req, res) {
  try {
    const user = requireAuth(req);

    const {
      page = '1',
      limit = '50',
      search = '',
      status = '',
      tailor_id = '',
      fromDate = '',
      toDate = '',
      branch = '',
    } = req.query || {};

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'tailor') {
      whereConditions.push(`f.tailor_id = $${paramIndex}`);
      params.push(user.userId);
      paramIndex++;
    }

    // Status filter
    if (status) {
      whereConditions.push(`f.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Tailor filter
    if (tailor_id && user.role !== 'tailor') {
      whereConditions.push(`f.tailor_id = $${paramIndex}`);
      params.push(tailor_id);
      paramIndex++;
    }

    // Branch filter
    if (branch) {
      whereConditions.push(`f.branch = $${paramIndex}`);
      params.push(branch);
      paramIndex++;
    }

    // Date range filter
    if (fromDate) {
      whereConditions.push(`f.scheduled_at >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }
    if (toDate) {
      whereConditions.push(`f.scheduled_at <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    // Search filter
    if (search) {
      whereConditions.push(
        `(c.name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex} OR m.entry_id ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count
       FROM fittings f
       LEFT JOIN customers c ON f.customer_id = c.id
       LEFT JOIN measurements m ON f.measurement_id = m.id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count, 10);

    // Get fittings
    const fittings = await query(
      `SELECT 
        f.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        m.entry_id as measurement_entry_id,
        u.name as tailor_name,
        u.email as tailor_email
       FROM fittings f
       LEFT JOIN customers c ON f.customer_id = c.id
       LEFT JOIN measurements m ON f.measurement_id = m.id
       LEFT JOIN users u ON f.tailor_id = u.id
       WHERE ${whereClause}
       ORDER BY f.scheduled_at ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    return res.status(200).json({
      data: fittings || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get fittings error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// POST /api/fittings
async function createFitting(req, res) {
  try {
    const user = requireAuth(req);

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { measurement_id, customer_id, tailor_id, scheduled_at, status, notes, branch } = req.body;

    if (!scheduled_at) {
      return res.status(400).json({ error: 'Scheduled date and time is required' });
    }

    // Validate scheduled_at is in the future
    const scheduledDate = new Date(scheduled_at);
    if (scheduledDate < new Date()) {
      return res.status(400).json({ error: 'Scheduled date must be in the future' });
    }

    // Use current user as tailor if not specified
    const assignedTailor = tailor_id || (user.role === 'tailor' ? user.userId : null);
    if (!assignedTailor) {
      return res.status(400).json({ error: 'Tailor must be assigned' });
    }

    // Create fitting
    const result = await query(
      `INSERT INTO fittings (measurement_id, customer_id, tailor_id, scheduled_at, status, notes, branch)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        measurement_id || null,
        customer_id || null,
        assignedTailor,
        scheduled_at,
        status || 'scheduled',
        notes || null,
        branch || (user.branch || null),
      ]
    );

    await logAudit(req, user.userId, 'create', 'fitting', result[0].id, { scheduled_at, customer_id });

    return res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create fitting error:', error);
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
    return getFittings(req, res);
  } else if (req.method === 'POST') {
    return createFitting(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

