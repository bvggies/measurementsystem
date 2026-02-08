/**
 * POST /api/customers/consent - Log customer consent (store/use measurements)
 * GET /api/customers/consent?customer_id=uuid - Get consent history for customer
 */

const { query } = require('../../utils/db');
const { requireAuth, requireRole } = require('../../utils/auth');

async function logConsent(req, res) {
  try {
    const user = requireRole(['admin', 'manager', 'tailor'])(req);
    const body = req.body || {};
    const { customer_id, consent_type, granted = true, notes } = body;
    if (!customer_id || !consent_type) {
      return res.status(400).json({ error: 'customer_id and consent_type required' });
    }
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
    const ua = req.headers['user-agent'] || '';
    try {
      const result = await query(
        `INSERT INTO customer_consent_logs (customer_id, consent_type, granted, ip_address, user_agent, user_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, customer_id, consent_type, granted, granted_at, ip_address, user_id`,
        [customer_id, consent_type, !!granted, ip, ua, user.userId, notes || null]
      );
      return res.status(201).json(result[0]);
    } catch (err) {
      if (err.message && err.message.includes('customer_consent_logs')) {
        return res.status(501).json({ error: 'Consent tracking not configured. Run database/schema_enhancements.sql' });
      }
      throw err;
    }
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Log consent error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function getConsentHistory(req, res) {
  try {
    requireAuth(req);
    const customer_id = req.query?.customer_id;
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id query required' });
    }
    let rows;
    try {
      rows = await query(
        `SELECT id, customer_id, consent_type, granted, granted_at, ip_address, user_id, notes
         FROM customer_consent_logs
         WHERE customer_id = $1
         ORDER BY granted_at DESC
         LIMIT 100`,
        [customer_id]
      );
    } catch (err) {
      if (err.message && err.message.includes('customer_consent_logs')) {
        return res.status(200).json({ history: [] });
      }
      throw err;
    }
    return res.status(200).json({ history: rows || [] });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get consent history error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'POST') return logConsent(req, res);
  if (req.method === 'GET') return getConsentHistory(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
