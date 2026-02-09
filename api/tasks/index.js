/**
 * GET /api/tasks - List task assignments (filter by assignee, status)
 * POST /api/tasks - Create task (admin/manager)
 */

const { query } = require('../utils/db');
const { requireAuth, requireRole } = require('../utils/auth');
const { logAudit } = require('../utils/audit');
const { handleCors } = require('../utils/cors');

async function getTasks(req, res) {
  try {
    const user = requireAuth(req);
    const { assignee_id, status = '', limit = '50' } = req.query || {};
    let sql = `
      SELECT t.*, u.name as assignee_name, u2.name as created_by_name,
        m.entry_id as measurement_entry_id, c.name as customer_name
      FROM task_assignments t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN measurements m ON t.resource_type = 'measurement' AND t.resource_id = m.id
      LEFT JOIN customers c ON m.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (assignee_id) {
      sql += ` AND t.assignee_id = $${i}`;
      params.push(assignee_id);
      i++;
    } else if (user.role === 'tailor') {
      sql += ` AND t.assignee_id = $${i}`;
      params.push(user.userId);
      i++;
    }
    if (status) {
      sql += ` AND t.status = $${i}`;
      params.push(status);
      i++;
    }
    sql += ` ORDER BY t.due_at ASC NULLS LAST, t.created_at DESC LIMIT $${i}`;
    params.push(Math.min(parseInt(limit, 10) || 50, 100));
    let rows;
    try {
      rows = await query(sql, params);
    } catch (err) {
      if (err.message?.includes('task_assignments')) {
        return res.status(200).json({ tasks: [] });
      }
      throw err;
    }
    return res.status(200).json({ tasks: rows || [] });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get tasks error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function createTask(req, res) {
  try {
    const user = requireRole(['admin', 'manager'])(req);
    const body = req.body || {};
    const { assignee_id, task_type, resource_type, resource_id, due_at } = body;
    if (!assignee_id || !task_type || !resource_type) {
      return res.status(400).json({ error: 'assignee_id, task_type, resource_type required' });
    }
    try {
      const result = await query(
        `INSERT INTO task_assignments (assignee_id, task_type, resource_type, resource_id, due_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, assignee_id, task_type, resource_type, resource_id, due_at, status, created_at`,
        [assignee_id, task_type, resource_type, resource_id || null, due_at || null, user.userId]
      );
      await logAudit(req, user.userId, 'create', 'task', result[0].id, { assignee_id, task_type });
      return res.status(201).json(result[0]);
    } catch (err) {
      if (err.message?.includes('task_assignments')) {
        return res.status(501).json({ error: 'Tasks not configured. Run database/schema_enhancements.sql' });
      }
      throw err;
    }
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') return getTasks(req, res);
  if (req.method === 'POST') return createTask(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
