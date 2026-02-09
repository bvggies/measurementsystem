/**
 * GET /api/measurements/compare?ids=id1,id2 - Side-by-side comparison of measurements
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { handleCors } = require('../utils/cors');

const FIELDS = [
  'entry_id', 'units', 'fit_preference',
  'across_back', 'chest', 'sleeve_length', 'around_arm', 'neck', 'top_length', 'wrist',
  'trouser_waist', 'trouser_thigh', 'trouser_knee', 'trouser_length', 'trouser_bars',
  'additional_info', 'created_at', 'updated_at', 'version'
];

function toPlainValue(v) {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'bigint') return String(v);
  return v;
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
  }
  try {
    requireAuth(req);
    const idsParam = req.query?.ids || req.query?.id;
    if (!idsParam) {
      return res.status(400).end(JSON.stringify({ error: 'Query parameter ids required (e.g. ids=uuid1,uuid2)' }));
    }
    const ids = (typeof idsParam === 'string' ? idsParam.split(',') : [idsParam]).map((s) => s.trim()).filter(Boolean);
    if (ids.length < 2 || ids.length > 5) {
      return res.status(400).end(JSON.stringify({ error: 'Provide between 2 and 5 measurement ids' }));
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const rows = await query(
      `SELECT m.*, c.name as customer_name, c.phone as customer_phone,
        u.name as created_by_name
       FROM measurements m
       LEFT JOIN customers c ON m.customer_id = c.id
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.id IN (${placeholders})
       ORDER BY m.created_at ASC`,
      ids
    );

    if (rows.length !== ids.length) {
      return res.status(404).end(JSON.stringify({ error: 'One or more measurements not found' }));
    }

    const comparison = rows.map((r) => {
      const row = {};
      FIELDS.forEach((f) => {
        if (r[f] !== undefined) row[f] = toPlainValue(r[f]);
      });
      row.id = r.id;
      row.customer_name = r.customer_name;
      row.customer_phone = r.customer_phone;
      row.created_by_name = r.created_by_name;
      return row;
    });

    return res.status(200).end(JSON.stringify({ comparison }));
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).end(JSON.stringify({ error: error.message }));
    }
    console.error('Compare measurements error:', error);
    return res.status(500).end(JSON.stringify({ error: 'Internal server error', message: error.message }));
  }
};
