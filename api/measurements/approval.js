/**
 * GET /api/measurements/approval - List pending approval requests (customer self-entry)
 * POST /api/measurements/approval - Approve or reject a measurement (admin/manager/tailor)
 */

const { query, transaction } = require('../../utils/db');
const { requireAuth, requireRole } = require('../../utils/auth');
const { logAudit } = require('../../utils/audit');
const { createNotification } = require('../../utils/notifications');

async function getPending(req, res) {
  try {
    requireRole(['admin', 'manager', 'tailor'])(req);
    let rows;
    try {
      rows = await query(
        `SELECT ar.*, m.entry_id, m.customer_id, m.approval_status,
          c.name as customer_name, c.phone as customer_phone,
          u1.name as requested_by_name, u2.name as approved_by_name
         FROM measurement_approval_requests ar
         JOIN measurements m ON ar.measurement_id = m.id
         LEFT JOIN customers c ON m.customer_id = c.id
         LEFT JOIN users u1 ON ar.requested_by = u1.id
         LEFT JOIN users u2 ON ar.approved_by = u2.id
         WHERE ar.status = 'pending'
         ORDER BY ar.requested_at ASC`,
        []
      );
    } catch (err) {
      if (err.message && err.message.includes('measurement_approval_requests')) {
        return res.status(200).json({ pending: [] });
      }
      throw err;
    }
    return res.status(200).json({ pending: rows || [] });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Get approval pending error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function decide(req, res) {
  try {
    const user = requireRole(['admin', 'manager', 'tailor'])(req);
    const body = req.body || {};
    const { measurement_id, status, rejection_reason } = body;
    if (!measurement_id || !status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'measurement_id and status (approved|rejected) required' });
    }
    let requestedBy = null;
    try {
      const reqRow = await query(
        'SELECT requested_at, requested_by FROM measurement_approval_requests WHERE measurement_id = $1 AND status = $2',
        [measurement_id, 'pending']
      );
      const requestedAt = reqRow[0]?.requested_at;
      requestedBy = reqRow[0]?.requested_by;

      await transaction(async (client) => {
        await client.query(
          `UPDATE measurement_approval_requests
           SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, rejection_reason = $3
           WHERE measurement_id = $4 AND status = 'pending'`,
          [status, user.userId, status === 'rejected' ? (rejection_reason || null) : null, measurement_id]
        );
        await client.query(
          `UPDATE measurements SET approval_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3`,
          [status === 'approved' ? 'approved' : 'rejected', status === 'approved' ? user.userId : null, measurement_id]
        );
      });

      await logAudit(req, user.userId, status === 'approved' ? 'approve' : 'reject', 'measurement', measurement_id, { status });
      if (status === 'approved' && requestedAt) {
        try {
          const durationSeconds = Math.round((Date.now() - new Date(requestedAt).getTime()) / 1000);
          await query(
            `INSERT INTO sla_logs (measurement_id, action_type, started_at, completed_at, duration_seconds, assignee_id)
             VALUES ($1, 'approve', $2, CURRENT_TIMESTAMP, $3, $4)`,
            [measurement_id, requestedAt, durationSeconds, user.userId]
          );
        } catch (slaErr) {
          if (!slaErr.message?.includes('sla_logs')) console.log('SLA log failed:', slaErr.message);
        }
      }
      if (requestedBy) {
        await createNotification(
          requestedBy,
          status === 'approved' ? 'measurement_approved' : 'measurement_rejected',
          status === 'approved' ? 'Measurement approved' : 'Measurement rejected',
          status === 'approved' ? 'Your measurement update was approved.' : (rejection_reason || 'Your measurement update was rejected.'),
          'measurement',
          measurement_id
        );
      }
    } catch (txErr) {
      if (txErr.message && txErr.message.includes('measurement_approval_requests')) {
        return res.status(501).json({ error: 'Approval workflow not configured. Run database/schema_enhancements.sql' });
      }
      throw txErr;
    }
    return res.status(200).json({ message: status === 'approved' ? 'Measurement approved' : 'Measurement rejected' });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Approval decide error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return getPending(req, res);
  if (req.method === 'POST') return decide(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
