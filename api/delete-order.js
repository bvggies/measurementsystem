/**
 * DELETE /api/delete-order?id=xxx
 * Delete an order by id (UUID).
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
      return res.status(400).end(JSON.stringify({ error: 'Order ID is required' }));
    }

    if (user.role !== 'admin') {
      return res.status(403).end(JSON.stringify({ error: 'Only admins can delete orders' }));
    }

    const existing = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).end(JSON.stringify({ error: 'Order not found' }));
    }

    await query('DELETE FROM orders WHERE id = $1', [id]);
    await logAudit(req, user.userId, 'delete', 'order', id, { deleted: true });

    res.status(200);
    return res.end(JSON.stringify({ message: 'Order deleted successfully', deletedId: id }));
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).end(JSON.stringify({ error: error.message }));
    }
    console.error('Delete order error:', error);
    return res.status(500).end(JSON.stringify({
      error: 'Failed to delete order',
      message: error.message || 'Internal server error',
    }));
  }
};
