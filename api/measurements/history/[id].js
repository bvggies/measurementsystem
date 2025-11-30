/**
 * GET /api/measurements/history/:id
 * Get measurement history/audit trail
 * JavaScript version for Vercel compatibility
 */

const { query } = require('../../../utils/db');
const { requireAuth } = require('../../../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req);
    const { id } = req.query;

    // Verify measurement exists and user has access
    const measurements = await query('SELECT * FROM measurements WHERE id = $1', [id]);
    if (measurements.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    // Get history
    const history = await query(
      `SELECT 
        h.*,
        u.name as changed_by_name,
        u.email as changed_by_email
       FROM measurement_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.measurement_id = $1
       ORDER BY h.changed_at DESC`,
      [id]
    );

    return res.status(200).json({
      measurementId: id,
      history: history || [],
    });
  } catch (error) {
    console.error('Get history error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

