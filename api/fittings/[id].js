/**
 * GET /api/fittings/:id - Get single fitting
 * PUT /api/fittings/:id - Update fitting
 * DELETE /api/fittings/:id - Delete fitting
 * JavaScript version for Vercel compatibility
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { logAudit } = require('../utils/audit');
const { handleCors } = require('../utils/cors');

// GET /api/fittings/:id
async function getFitting(req, res) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;

    const fittings = await query(
      `SELECT 
        f.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.address as customer_address,
        m.entry_id as measurement_entry_id,
        m.id as measurement_id,
        u.name as tailor_name,
        u.email as tailor_email
       FROM fittings f
       LEFT JOIN customers c ON f.customer_id = c.id
       LEFT JOIN measurements m ON f.measurement_id = m.id
       LEFT JOIN users u ON f.tailor_id = u.id
       WHERE f.id = $1`,
      [id]
    );

    if (fittings.length === 0) {
      return res.status(404).json({ error: 'Fitting not found' });
    }

    const fitting = fittings[0];

    // Role-based access control
    if (user.role === 'tailor' && fitting.tailor_id !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json(fitting);
  } catch (error) {
    console.error('Get fitting error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// PUT /api/fittings/:id
async function updateFitting(req, res) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get existing fitting
    const existing = await query('SELECT * FROM fittings WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Fitting not found' });
    }

    // Role-based access control
    if (user.role === 'tailor' && existing[0].tailor_id !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { measurement_id, customer_id, tailor_id, scheduled_at, status, notes, branch } = req.body;

    // Validate scheduled_at if provided
    if (scheduled_at) {
      const scheduledDate = new Date(scheduled_at);
      if (scheduledDate < new Date() && status !== 'completed' && status !== 'cancelled') {
        return res.status(400).json({ error: 'Scheduled date must be in the future' });
      }
    }

    // Update fitting
    const result = await query(
      `UPDATE fittings 
       SET measurement_id = COALESCE($1, measurement_id),
           customer_id = COALESCE($2, customer_id),
           tailor_id = COALESCE($3, tailor_id),
           scheduled_at = COALESCE($4, scheduled_at),
           status = COALESCE($5, status),
           notes = COALESCE($6, notes),
           branch = COALESCE($7, branch),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [measurement_id, customer_id, tailor_id, scheduled_at, status, notes, branch, id]
    );

    await logAudit(req, user.userId, 'update', 'fitting', id, { changes: Object.keys(req.body) });

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Update fitting error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// DELETE /api/fittings/:id
async function deleteFitting(req, res) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const existing = await query('SELECT * FROM fittings WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Fitting not found' });
    }

    // Role-based access control
    if (user.role === 'tailor' && existing[0].tailor_id !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM fittings WHERE id = $1', [id]);

    await logAudit(req, user.userId, 'delete', 'fitting', id, { scheduled_at: existing[0].scheduled_at });

    return res.status(200).json({ message: 'Fitting deleted successfully' });
  } catch (error) {
    console.error('Delete fitting error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method === 'GET') {
    return getFitting(req, res);
  } else if (req.method === 'PUT') {
    return updateFitting(req, res);
  } else if (req.method === 'DELETE') {
    return deleteFitting(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

