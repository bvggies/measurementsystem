/**
 * Audit logging with IP and user-agent (for activity logs / security)
 */

const { query } = require('./db');

function getClientInfo(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || '';
  const userAgent = req.headers['user-agent'] || '';
  return { ip: ip.substring(0, 255), userAgent: userAgent.substring(0, 512) };
}

async function logAudit(req, userId, action, resourceType, resourceId, details) {
  const { ip, userAgent } = getClientInfo(req);
  const detailsStr = typeof details === 'string' ? details : JSON.stringify(details || {});
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, resourceType, resourceId, detailsStr, ip, userAgent]
    );
  } catch (err) {
    console.log('Audit log failed:', err.message);
  }
}

module.exports = { logAudit, getClientInfo };
