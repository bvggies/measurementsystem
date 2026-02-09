/**
 * DELETE /api/delete-fitting?id=xxx
 * Delete a fitting by id (UUID).
 * Static route for Vercel so DELETE works reliably (avoids dynamic [id] routing).
 */

const { query } = require('./utils/db');
const { requireAuth } = require('./utils/auth');
const { logAudit } = require('./utils/audit');
const { handleCors } = require('./utils/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'DELETE') {
    return res.status(405).end(JSON.stringify({ error: 'Method not allowed' }));
  }
  try {
    const user = requireAuth(req);
    const id = (req.query && req.query.id) ? String(req.query.id).trim() : null;
    if (!id) {
      return res.status(400).end(JSON.stringify({ error: 'Fitting ID is required' }));
    }

    if (user.role === 'customer') {
      return res.status(403).end(JSON.stringify({ error: 'Insufficient permissions' }));
    }

    const existing = await query('SELECT * FROM fittings WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).end(JSON.stringify({ error: 'Fitting not found' }));
    }

    if (user.role === 'tailor' && existing[0].tailor_id !== user.userId) {
      return res.status(403).end(JSON.stringify({ error: 'Access denied' }));
    }

    await query('DELETE FROM fittings WHERE id = $1', [id]);
    await logAudit(req, user.userId, 'delete', 'fitting', id, { scheduled_at: existing[0].scheduled_at });

    res.status(200);
    return res.end(JSON.stringify({ message: 'Fitting deleted successfully' }));
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).end(JSON.stringify({ error: error.message }));
    }
    console.error('Delete fitting error:', error);
    return res.status(500).end(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }));
  }
};
