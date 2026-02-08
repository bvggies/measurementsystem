/**
 * GET /api/templates/:id - Get single measurement template
 */

const { query } = require('../../utils/db');
const { requireAuth } = require('../../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    requireAuth(req);
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Template id required' });
    }
    const rows = await query(
      'SELECT * FROM measurement_templates WHERE id = $1',
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    const row = rows[0];
    return res.status(200).json({
      ...row,
      template_type: row.template_type || 'custom',
      region: row.region || '',
    });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get template error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
