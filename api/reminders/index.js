/**
 * GET /api/reminders - List measurement reminders (filter by customer, status)
 * POST /api/reminders - Create reminder (admin/manager)
 */

const { query } = require('../utils/db');
const { requireAuth, requireRole } = require('../utils/auth');
const { handleCors } = require('../utils/cors');

async function getReminders(req, res) {
  try {
    const user = requireAuth(req);
    const { customer_id, status = '', limit = '50' } = req.query || {};
    let sql = `
      SELECT r.*, c.name as customer_name, c.phone as customer_phone,
        m.entry_id as measurement_entry_id
      FROM measurement_reminders r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN measurements m ON r.measurement_id = m.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (customer_id) {
      sql += ` AND r.customer_id = $${i}`;
      params.push(customer_id);
      i++;
    }
    if (status) {
      sql += ` AND r.status = $${i}`;
      params.push(status);
      i++;
    }
    if (user.role === 'tailor') {
      sql += ` AND r.created_by = $${i}`;
      params.push(user.userId);
      i++;
    }
    sql += ` ORDER BY r.due_at ASC NULLS LAST LIMIT $${i}`;
    params.push(Math.min(parseInt(limit, 10) || 50, 100));
    let rows;
    try {
      rows = await query(sql, params);
    } catch (err) {
      if (err.message && err.message.includes('measurement_reminders')) {
        return res.status(200).json({ reminders: [] });
      }
      throw err;
    }
    return res.status(200).json({ reminders: rows || [] });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get reminders error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function createReminder(req, res) {
  try {
    const user = requireRole(['admin', 'manager'])(req);
    const body = req.body || {};
    const { customer_id, measurement_id, reminder_type = 'periodic', due_at, channel = 'in_app' } = body;
    if (!customer_id || !due_at) {
      return res.status(400).json({ error: 'customer_id and due_at are required' });
    }
    const result = await query(
      `INSERT INTO measurement_reminders (customer_id, measurement_id, reminder_type, due_at, channel, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, customer_id, measurement_id, reminder_type, due_at, status, channel, created_at`,
      [customer_id, measurement_id || null, reminder_type, due_at, channel, user.userId]
    );
    return res.status(201).json(result[0]);
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message && error.message.includes('measurement_reminders')) {
      return res.status(501).json({ error: 'Reminders not configured. Run database/schema_enhancements.sql' });
    }
    console.error('Create reminder error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') return getReminders(req, res);
  if (req.method === 'POST') return createReminder(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
