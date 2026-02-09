/**
 * GET /api/tasks/:id - Get task
 * PATCH /api/tasks/:id - Update task (status, completed_at)
 * DELETE /api/tasks/:id - Delete task (admin/manager)
 */

const { query } = require('../utils/db');
const { requireAuth, requireRole } = require('../utils/auth');
const { logAudit } = require('../utils/audit');

async function getTask(req, res) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;
    const rows = await query(
      `SELECT t.*, u.name as assignee_name, u2.name as created_by_name
       FROM task_assignments t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       WHERE t.id = $1`,
      [id]
    );
    if (!rows?.length) return res.status(404).json({ error: 'Task not found' });
    if (user.role === 'tailor' && rows[0].assignee_id !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    if (error.message?.includes('task_assignments')) {
      return res.status(404).json({ error: 'Task not found' });
    }
    console.error('Get task error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function updateTask(req, res) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;
    const body = req.body || {};
    const { status } = body;
    const existing = await query('SELECT * FROM task_assignments WHERE id = $1', [id]);
    if (!existing?.length) return res.status(404).json({ error: 'Task not found' });
    if (user.role === 'tailor' && existing[0].assignee_id !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const updates = [];
    const params = [];
    let i = 1;
    if (status && ['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      updates.push(`status = $${i}`);
      params.push(status);
      i++;
      if (status === 'completed') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid updates' });
    }
    params.push(id);
    await query(
      `UPDATE task_assignments SET ${updates.join(', ')} WHERE id = $${i}`,
      params
    );
    await logAudit(req, user.userId, 'update', 'task', id, { status });
    return res.status(200).json({ message: 'Task updated' });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function deleteTask(req, res) {
  try {
    const user = requireRole(['admin', 'manager'])(req);
    const { id } = req.query;
    const existing = await query('SELECT * FROM task_assignments WHERE id = $1', [id]);
    if (!existing?.length) return res.status(404).json({ error: 'Task not found' });
    await query('DELETE FROM task_assignments WHERE id = $1', [id]);
    await logAudit(req, user.userId, 'delete', 'task', id, {});
    return res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return getTask(req, res);
  if (req.method === 'PATCH' || req.method === 'PUT') return updateTask(req, res);
  if (req.method === 'DELETE') return deleteTask(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
