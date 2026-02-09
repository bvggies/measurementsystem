/**
 * DELETE /api/delete-measurement?id=xxx
 * Delete a measurement by id (UUID) or entry_id.
 * Static route for Vercel so DELETE works reliably (avoids dynamic [id] routing).
 */

const { query } = require('./utils/db');
const { requireAuth } = require('./utils/auth');
const { logAudit } = require('./utils/audit');
const { handleCors } = require('./utils/cors');

function isUuid(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str));
}

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
      return res.status(400).end(JSON.stringify({ error: 'Measurement ID is required' }));
    }

    if (user.role !== 'admin') {
      return res.status(403).end(JSON.stringify({ error: 'Only admins can delete measurements' }));
    }

    let existing = await query(
      'SELECT m.*, c.name as customer_name FROM measurements m LEFT JOIN customers c ON m.customer_id = c.id WHERE m.id = $1',
      [id]
    );
    if (existing.length === 0 && !isUuid(id)) {
      existing = await query(
        'SELECT m.*, c.name as customer_name FROM measurements m LEFT JOIN customers c ON m.customer_id = c.id WHERE m.entry_id = $1',
        [id]
      );
    }
    if (existing.length === 0) {
      return res.status(404).end(JSON.stringify({ error: 'Measurement not found' }));
    }

    const measurement = existing[0];
    const measurementId = measurement.id;

    await query('DELETE FROM measurements WHERE id = $1', [measurementId]);
    await logAudit(req, user.userId, 'delete', 'measurement', measurementId, {
      entry_id: measurement.entry_id,
      customer_name: measurement.customer_name,
    });

    res.status(200);
    return res.end(JSON.stringify({ message: 'Measurement deleted successfully', deletedId: measurementId }));
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).end(JSON.stringify({ error: error.message }));
    }
    console.error('Delete measurement error:', error);
    return res.status(500).end(JSON.stringify({
      error: 'Failed to delete measurement',
      message: error.message || 'Internal server error',
    }));
  }
};
