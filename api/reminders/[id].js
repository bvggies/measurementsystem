/**
 * PATCH /api/reminders/:id - Update reminder (mark sent, snooze, cancel)
 */

const { query } = require('../../utils/db');
const { requireAuth, requireRole } = require('../../utils/auth');

module.exports = async (req, res) => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = requireRole(['admin', 'manager'])(req);
    const id = req.query.id;
    const body = req.body || {};
    const { status } = body;
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });
    const valid = ['pending', 'sent', 'snoozed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'status invalid' });
    try {
      const updates = ['status = $1'];
      const params = [status];
      let idx = 2;
      if (status === 'sent') {
        updates.push('sent_at = CURRENT_TIMESTAMP');
      }
      if (status === 'snoozed' && body.snooze_until) {
        updates.push(`due_at = $${idx}`);
        params.push(body.snooze_until);
        idx++;
      }
      params.push(id);
      await query(
        `UPDATE measurement_reminders SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id`,
        params
      );
      return res.status(200).json({ message: 'Reminder updated' });
    } catch (err) {
      if (err.message?.includes('measurement_reminders')) return res.status(404).json({ error: 'Reminder not found' });
      throw err;
    }
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Update reminder error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
