/**
 * GET /api/measurements - List measurements with pagination and filters
 * POST /api/measurements - Create new measurement
 * JavaScript version for Vercel compatibility
 */

const { query, transaction } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { validateMeasurement } = require('../utils/validation');

// GET /api/measurements
async function getMeasurements(req, res) {
  try {
    const user = requireAuth(req);

    const {
      page = '1',
      limit = '20',
      search = '',
      branch = '',
      unit = '',
      tailor = '',
      status = '',
      fromDate = '',
      toDate = '',
    } = req.query || {};

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'tailor') {
      whereConditions.push(`m.created_by = $${paramIndex}`);
      params.push(user.userId);
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

    // Branch filter
    if (branch) {
      whereConditions.push(`m.branch = $${paramIndex}`);
      params.push(branch);
      paramIndex++;
    }

    // Unit filter
    if (unit) {
      whereConditions.push(`m.units = $${paramIndex}`);
      params.push(unit);
      paramIndex++;
    }

    // Tailor filter
    if (tailor) {
      whereConditions.push(`m.created_by = $${paramIndex}`);
      params.push(tailor);
      paramIndex++;
    }

    // Date range filter
    if (fromDate) {
      whereConditions.push(`m.created_at >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }
    if (toDate) {
      whereConditions.push(`m.created_at <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count
       FROM measurements m
       LEFT JOIN customers c ON m.customer_id = c.id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Get measurements
    const measurementsParams = [...params, limitNum, offset];
    const measurements = await query(
      `SELECT 
        m.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        u.name as created_by_name,
        m.created_by
       FROM measurements m
       LEFT JOIN customers c ON m.customer_id = c.id
       LEFT JOIN users u ON m.created_by = u.id
       WHERE ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      measurementsParams
    );

    return res.status(200).json({
      data: measurements || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get measurements error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// POST /api/measurements
async function createMeasurement(req, res) {
  try {
    const user = requireAuth(req);

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const data = req.body;

    // Validate measurement
    const validation = validateMeasurement(data, data.units || 'cm');
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Generate entry_id if not provided
    const entryId = data.entry_id || `ENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Find or create customer
    let customerId = null;
    if (data.client_name || data.client_phone) {
      const existingCustomers = await query(
        `SELECT id FROM customers 
         WHERE (phone = $1 AND $1 IS NOT NULL) 
            OR (email = $2 AND $2 IS NOT NULL AND $2 != '')
         LIMIT 1`,
        [data.client_phone, data.client_email]
      );

      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
        // Update customer info if provided
        if (data.client_name || data.client_email || data.client_address) {
          await query(
            `UPDATE customers 
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 address = COALESCE($3, address),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [data.client_name, data.client_email, data.client_address, customerId]
          );
        }
      } else {
        const newCustomers = await query(
          `INSERT INTO customers (name, phone, email, address)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [data.client_name || 'Unknown', data.client_phone, data.client_email, data.client_address]
        );
        customerId = newCustomers[0].id;
      }
    }

    // Get user branch if needed
    let branch = data.branch;
    if (!branch && user.role !== 'admin') {
      const userResult = await query('SELECT branch FROM users WHERE id = $1', [user.userId]);
      branch = userResult[0]?.branch || null;
    }

    // Create measurement
    const result = await query(
      `INSERT INTO measurements (
        customer_id, created_by, entry_id, units,
        across_back, chest, sleeve_length, around_arm, neck, top_length, wrist,
        trouser_waist, trouser_thigh, trouser_knee, trouser_length, trouser_bars,
        additional_info, branch, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 1
      ) RETURNING id`,
      [
        customerId,
        user.userId,
        entryId,
        data.units || 'cm',
        data.across_back || null,
        data.chest || null,
        data.sleeve_length || null,
        data.around_arm || null,
        data.neck || null,
        data.top_length || null,
        data.wrist || null,
        data.trouser_waist || null,
        data.trouser_thigh || null,
        data.trouser_knee || null,
        data.trouser_length || null,
        data.trouser_bars || null,
        data.additional_info || null,
        branch,
      ]
    );

    // Log audit (handle case where activity_logs table might be used instead)
    try {
      await query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, 'create', 'measurement', $2, $3)`,
        [user.userId, result[0].id, JSON.stringify({ entry_id: entryId })]
      );
    } catch (err) {
      // activity_logs table might not exist or have different structure
      console.log('Could not log activity:', err.message);
    }

    return res.status(201).json({
      id: result[0].id,
      entry_id: entryId,
      message: 'Measurement created successfully',
    });
  } catch (error) {
    console.error('Create measurement error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return getMeasurements(req, res);
  } else if (req.method === 'POST') {
    return createMeasurement(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

