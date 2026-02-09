/**
 * GET /api/users - List users (admin/manager only). Query: role=tailor|admin|manager
 */

const { query } = require('../utils/db');
const { requireAuth, requireRole } = require('../utils/auth');
const { handleCors } = require('../utils/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    requireRole(['admin', 'manager'])(req);
    const role = req.query?.role || '';
    let rows;
    if (role) {
      rows = await query(
        'SELECT id, name, email, role, branch, created_at FROM users WHERE role = $1 ORDER BY name',
        [role]
      );
    } else {
      rows = await query(
        'SELECT id, name, email, role, branch, created_at FROM users ORDER BY role, name'
      );
    }
    return res.status(200).json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Users list error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
