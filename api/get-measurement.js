/**
 * GET /api/get-measurement?id=xxx
 * Fetch a single measurement by id (UUID) or entry_id.
 * Static route for Vercel so we always get JSON (avoids dynamic [id] routing issues).
 */

const { query } = require('./utils/db');
const { requireAuth } = require('./utils/auth');
const { handleCors } = require('./utils/cors');

function isUuid(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str));
}

function toPlainMeasurement(row) {
  if (!row || typeof row !== 'object') return null;
  const out = {};
  for (const key of Object.keys(row)) {
    const v = row[key];
    if (v instanceof Date) out[key] = v.toISOString();
    else if (typeof v === 'bigint') out[key] = String(v);
    else out[key] = v;
  }
  return out;
}

async function getMeasurement(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const user = requireAuth(req);
    const id = (req.query && req.query.id) ? String(req.query.id).trim() : null;
    if (!id) {
      return res.status(400).end(JSON.stringify({ success: false, error: 'Measurement ID is required' }));
    }

    const baseSql = `SELECT 
        m.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.address as customer_address,
        u.name as created_by_name
       FROM measurements m
       LEFT JOIN customers c ON m.customer_id = c.id
       LEFT JOIN users u ON m.created_by = u.id`;

    let rows = await query(`${baseSql} WHERE m.id = $1`, [id]);
    if (rows.length === 0 && !isUuid(id)) {
      rows = await query(`${baseSql} WHERE m.entry_id = $1`, [id]);
    }

    if (rows.length === 0) {
      return res.status(404).end(JSON.stringify({ success: false, error: 'Measurement not found' }));
    }

    const row = rows[0];

    if (user.role === 'customer') {
      const customer = await query('SELECT id FROM customers WHERE email = $1', [user.email]);
      if (customer.length === 0 || row.customer_id !== customer[0].id) {
        return res.status(403).end(JSON.stringify({ success: false, error: 'Access denied' }));
      }
    } else if (user.role === 'tailor') {
      if (row.created_by !== user.userId) {
        return res.status(403).end(JSON.stringify({ success: false, error: 'Access denied' }));
      }
    }

    const data = toPlainMeasurement(row);
    res.status(200);
    return res.end(JSON.stringify({ success: true, data }));
  } catch (error) {
    console.error('Get measurement error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).end(JSON.stringify({ success: false, error: error.message }));
    }
    return res.status(500).end(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message,
    }));
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') {
    return getMeasurement(req, res);
  }
  res.setHeader('Content-Type', 'application/json');
  return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
};
