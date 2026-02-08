/**
 * GET /api/validation/rules - List auto-validation rules (impossible/unlikely/warning)
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    requireAuth(req);
    let rows;
    try {
      rows = await query(
        'SELECT id, name, rule_key, description, rule_type, field_a, field_b, operator, message_template, is_active, created_at FROM validation_rules WHERE is_active = true ORDER BY rule_type, name',
        []
      );
    } catch (err) {
      if (err.message && err.message.includes('validation_rules')) {
        return res.status(200).json({ rules: [] });
      }
      throw err;
    }
    return res.status(200).json({ rules: rows || [] });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get validation rules error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
