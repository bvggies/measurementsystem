/**
 * DELETE /api/delete-customer?id=xxx
 * Delete a customer by id (UUID).
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
      return res.status(400).end(JSON.stringify({ error: 'Customer ID is required' }));
    }

    if (user.role !== 'admin') {
      return res.status(403).end(JSON.stringify({ error: 'Only admins can delete customers' }));
    }

    const existing = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).end(JSON.stringify({ error: 'Customer not found' }));
    }

    const measurements = await query('SELECT COUNT(*) as count FROM measurements WHERE customer_id = $1', [id]);
    const orders = await query('SELECT COUNT(*) as count FROM orders WHERE customer_id = $1', [id]);
    if (parseInt(measurements[0].count, 10) > 0 || parseInt(orders[0].count, 10) > 0) {
      return res.status(400).end(JSON.stringify({
        error: 'Cannot delete customer with existing measurements or orders',
      }));
    }

    await query('DELETE FROM customers WHERE id = $1', [id]);
    await logAudit(req, user.userId, 'delete', 'customer', id, { name: existing[0].name });

    res.status(200);
    return res.end(JSON.stringify({ message: 'Customer deleted successfully' }));
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).end(JSON.stringify({ error: error.message }));
    }
    console.error('Delete customer error:', error);
    return res.status(500).end(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
    }));
  }
};
