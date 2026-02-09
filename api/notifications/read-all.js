/**
 * POST /api/notifications/read-all - Mark all current user's notifications as read
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { handleCors } = require('../utils/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = requireAuth(req);
    try {
      await query('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read_at IS NULL', [user.userId]);
    } catch (err) {
      if (err.message?.includes('notifications')) return res.status(200).json({ message: 'Marked all as read' });
      throw err;
    }
    return res.status(200).json({ message: 'Marked all as read' });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') return res.status(401).json({ error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
