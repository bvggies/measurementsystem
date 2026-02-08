/**
 * PATCH /api/notifications/:id/read - Mark notification as read
 */

const { query } = require('../../../utils/db');
const { requireAuth } = require('../../../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = requireAuth(req);
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const result = await query(
        `UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, user.userId]
      );
      if (!result?.length) return res.status(404).json({ error: 'Notification not found' });
      return res.status(200).json({ message: 'Marked as read' });
    } catch (err) {
      if (err.message?.includes('notifications')) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      throw err;
    }
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
