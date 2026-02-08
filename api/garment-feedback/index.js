const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { logAudit } = require('../utils/audit');

async function getFeedback(req, res) {
  try {
    requireAuth(req);
    const mid = req.query?.measurement_id;
    if (!mid) return res.status(400).json({ error: 'measurement_id required' });
    let rows;
    try {
      rows = await query(
        'SELECT g.*, u.name as created_by_name FROM garment_feedback g LEFT JOIN users u ON g.created_by = u.id WHERE g.measurement_id = $1 ORDER BY g.created_at DESC',
        [mid]
      );
    } catch (err) {
      if (err.message?.includes('garment_feedback')) return res.status(200).json({ feedback: [] });
      throw err;
    }
    return res.status(200).json({ feedback: rows || [] });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') return res.status(401).json({ error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function createFeedback(req, res) {
  try {
    const user = requireAuth(req);
    if (user.role === 'customer') return res.status(403).json({ error: 'Insufficient permissions' });
    const b = req.body || {};
    const { measurement_id, order_id, garment_type, fit_feedback, notes } = b;
    if (!measurement_id || !fit_feedback) return res.status(400).json({ error: 'measurement_id and fit_feedback required' });
    const valid = ['too_tight', 'slightly_tight', 'perfect', 'slightly_loose', 'too_loose'];
    if (!valid.includes(fit_feedback)) return res.status(400).json({ error: 'fit_feedback invalid' });
    try {
      const result = await query(
        'INSERT INTO garment_feedback (measurement_id, order_id, garment_type, fit_feedback, notes, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, measurement_id, garment_type, fit_feedback, notes, created_at',
        [measurement_id, order_id || null, garment_type || null, fit_feedback, notes || null, user.userId]
      );
      await logAudit(req, user.userId, 'create', 'garment_feedback', result[0].id, { measurement_id, fit_feedback });
      return res.status(201).json(result[0]);
    } catch (err) {
      if (err.message?.includes('garment_feedback')) return res.status(501).json({ error: 'Run schema_enhancements.sql' });
      throw err;
    }
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') return res.status(401).json({ error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return getFeedback(req, res);
  if (req.method === 'POST') return createFeedback(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
