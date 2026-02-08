/**
 * POST /api/backup/export - Export data as JSON (admin only), record in backup_logs
 */

const { query } = require('../utils/db');
const { requireRole } = require('../utils/auth');
const { logAudit } = require('../utils/audit');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = requireRole(['admin'])(req);
    let logId;
    try {
      const logResult = await query(
        `INSERT INTO backup_logs (backup_type, status, created_by) VALUES ('export', 'running', $1) RETURNING id`,
        [user.userId]
      );
      logId = logResult[0]?.id;
    } catch (e) {
      logId = null;
    }

    try {
      const [customers, measurements, usersPublic, orders, fittings] = await Promise.all([
        query('SELECT id, name, phone, email, address, created_at, updated_at FROM customers ORDER BY created_at'),
        query(`SELECT m.id, m.entry_id, m.customer_id, m.units, m.fit_preference, m.across_back, m.chest, m.sleeve_length,
          m.around_arm, m.neck, m.top_length, m.wrist, m.trouser_waist, m.trouser_thigh, m.trouser_knee,
          m.trouser_length, m.trouser_bars, m.additional_info, m.branch, m.version, m.created_at, m.updated_at
          FROM measurements m ORDER BY m.created_at`),
        query('SELECT id, name, email, role, branch, created_at FROM users'),
        query('SELECT id, measurement_id, customer_id, fabric, status, delivery_date, notes, created_at, updated_at FROM orders ORDER BY created_at'),
        query('SELECT id, measurement_id, customer_id, tailor_id, scheduled_at, status, notes, branch, created_at, updated_at FROM fittings ORDER BY scheduled_at'),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        exported_by: user.userId,
        customers: customers || [],
        measurements: measurements || [],
        users: usersPublic || [],
        orders: orders || [],
        fittings: fittings || [],
      };

      if (logId) {
        await query(
          `UPDATE backup_logs SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [logId]
        );
      }
      await logAudit(req, user.userId, 'export', 'backup', logId, { type: 'export' });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="fitrack-export-${new Date().toISOString().slice(0, 10)}.json"`);
      return res.status(200).send(JSON.stringify(exportData, null, 2));
    } catch (err) {
      if (logId) {
        await query(
          `UPDATE backup_logs SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = $1 WHERE id = $2`,
          [err.message?.substring(0, 500), logId]
        ).catch(() => {});
      }
      throw err;
    }
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
