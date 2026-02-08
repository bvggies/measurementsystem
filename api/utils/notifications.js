/**
 * Create in-app notification for a user
 */

const { query } = require('./db');

async function createNotification(userId, type, title, body, resourceType, resourceId) {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, resource_type, resource_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, type, title, body || null, resourceType || null, resourceId || null]
    );
  } catch (err) {
    if (!err.message?.includes('notifications')) console.log('Create notification failed:', err.message);
  }
}

module.exports = { createNotification };
