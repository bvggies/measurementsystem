/**
 * GET /api/permissions/me - Current user's granular permissions (view/edit/approve per resource)
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = requireAuth(req);
    let rows = [];
    try {
      rows = await query(
        'SELECT resource_type, action FROM permissions WHERE role = $1',
        [user.role]
      );
    } catch (err) {
      if (err.message && err.message.includes('permissions')) {
        return res.status(200).json({ permissions: [], role: user.role });
      }
      throw err;
    }
    const permissions = (rows || []).reduce((acc, r) => {
      const key = r.resource_type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r.action);
      return acc;
    }, {});
    return res.status(200).json({ permissions, role: user.role });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get permissions error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
