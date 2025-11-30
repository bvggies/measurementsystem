/**
 * GET /api/activity-logs - Get activity logs with pagination and filters
 * JavaScript version for Vercel compatibility
 */

const { query } = require('./utils/db');
const { requireAuth } = require('./utils/auth');

async function getActivityLogs(req, res) {
  try {
    const user = requireAuth(req);

    // Only admin and manager can view activity logs
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Build WHERE clause based on filters
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (req.query.action) {
      conditions.push(`al.action = $${paramIndex++}`);
      params.push(req.query.action);
    }

    if (req.query.resource_type) {
      conditions.push(`al.resource_type = $${paramIndex++}`);
      params.push(req.query.resource_type);
    }

    if (req.query.user_id) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      params.push(req.query.user_id);
    }

    if (req.query.fromDate) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(req.query.fromDate);
    }

    if (req.query.toDate) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(req.query.toDate + ' 23:59:59');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count - try activity_logs first, fallback to audit_logs
    let countResult;
    let tableName = 'activity_logs';
    try {
      countResult = await query(
        `SELECT COUNT(*) as total FROM activity_logs al ${whereClause}`,
        params
      );
    } catch (err) {
      // Fallback to audit_logs if activity_logs doesn't exist
      tableName = 'audit_logs';
      countResult = await query(
        `SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`,
        params
      );
    }
    const total = parseInt(countResult[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    // Get logs with user information
    params.push(limit, offset);
    const logs = await query(
      `SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
       FROM ${tableName} al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    // Parse details JSON if it's a string
    const parsedLogs = logs.map(log => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
    }));

    return res.status(200).json({
      data: parsedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch activity logs',
    });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return getActivityLogs(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

