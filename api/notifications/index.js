const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { handleCors } = require('../utils/cors');

async function getNotifications(req, res) {
  try {
    const user = requireAuth(req);
    const limit = Math.min(parseInt(req.query?.limit, 10) || 50, 100);
    let rows;
    try {
      rows = await query(
        'SELECT id, type, title, body, resource_type, resource_id, read_at, created_at FROM notifications WHERE user_id = $1 ORDER BY read_at ASC NULLS FIRST, created_at DESC LIMIT $2',
        [user.userId, limit]
      );
    } catch (err) {
      if (err.message?.includes('notifications')) return res.status(200).json({ notifications: [], unreadCount: 0 });
      throw err;
    }
    const unreadCount = (rows || []).filter((r) => !r.read_at).length;
    return res.status(200).json({ notifications: rows || [], unreadCount });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') return res.status(401).json({ error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') return getNotifications(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
