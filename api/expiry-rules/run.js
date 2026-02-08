/**
 * POST /api/expiry-rules/run - Run expiry check: mark measurements as expired per rules
 */

const { query } = require('../utils/db');
const { requireRole } = require('../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    requireRole(['admin', 'manager'])(req);
    let rules;
    try {
      rules = await query('SELECT * FROM measurement_expiry_rules WHERE is_active = true');
    } catch (err) {
      if (err.message?.includes('measurement_expiry_rules')) {
        return res.status(200).json({ marked: 0, message: 'No expiry rules' });
      }
      throw err;
    }
    let totalMarked = 0;
    const now = new Date();
    for (const rule of rules || []) {
      const days = rule.days_since_updated ?? rule.days_since_created ?? 365;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString();
      const action = rule.action === 'remind_only' ? 'remind_only' : 'mark_expired';
      let result;
      if (rule.days_since_updated != null) {
        result = await query(
          `UPDATE measurements SET is_expired = true, expires_at = CURRENT_TIMESTAMP
           WHERE updated_at < $1 AND (is_expired IS NOT TRUE OR is_expired IS NULL)
           RETURNING id`,
          [cutoffStr]
        );
      } else {
        result = await query(
          `UPDATE measurements SET is_expired = true, expires_at = CURRENT_TIMESTAMP
           WHERE created_at < $1 AND (is_expired IS NOT TRUE OR is_expired IS NULL)
           RETURNING id`,
          [cutoffStr]
        );
      }
      totalMarked += result?.length ?? 0;
    }
    return res.status(200).json({ marked: totalMarked, message: `Marked ${totalMarked} measurement(s) as expired` });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Run expiry error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
