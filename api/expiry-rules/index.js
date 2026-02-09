/**
 * GET /api/expiry-rules - List measurement expiry rules
 * POST /api/expiry-rules - Create rule (admin/manager)
 */

const { query } = require('../utils/db');
const { requireAuth, requireRole } = require('../utils/auth');
const { handleCors } = require('../utils/cors');

async function getRules(req, res) {
  try {
    requireAuth(req);
    let rows;
    try {
      rows = await query(
        'SELECT * FROM measurement_expiry_rules ORDER BY name'
      );
    } catch (err) {
      if (err.message?.includes('measurement_expiry_rules')) {
        return res.status(200).json({ rules: [] });
      }
      throw err;
    }
    return res.status(200).json({ rules: rows || [] });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get expiry rules error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function createRule(req, res) {
  try {
    requireRole(['admin', 'manager'])(req);
    const body = req.body || {};
    const { name, days_since_created, days_since_updated, action = 'mark_expired', branch } = body;
    if (!name) return res.status(400).json({ error: 'name required' });
    try {
      const result = await query(
        `INSERT INTO measurement_expiry_rules (name, days_since_created, days_since_updated, action, branch)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, days_since_created, days_since_updated, action, is_active, branch, created_at`,
        [name, days_since_created || null, days_since_updated || null, action, branch || null]
      );
      return res.status(201).json(result[0]);
    } catch (err) {
      if (err.message?.includes('measurement_expiry_rules')) {
        return res.status(501).json({ error: 'Expiry rules not configured. Run database/schema_enhancements.sql' });
      }
      throw err;
    }
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Create expiry rule error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') return getRules(req, res);
  if (req.method === 'POST') return createRule(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
