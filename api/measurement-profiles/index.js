/**
 * GET /api/measurement-profiles?customer_id=uuid - List measurement profiles (versions) for customer
 * POST /api/measurement-profiles - Create profile (wedding, weight change, seasonal)
 */

const { query } = require('../utils/db');
const { requireAuth, requireRole } = require('../utils/auth');

async function getProfiles(req, res) {
  try {
    requireAuth(req);
    const customer_id = req.query?.customer_id;
    if (!customer_id) {
      return res.status(400).json({ error: 'customer_id query required' });
    }
    let rows;
    try {
      rows = await query(
        `SELECT id, customer_id, name, profile_type, notes, created_at, updated_at
         FROM measurement_profiles
         WHERE customer_id = $1
         ORDER BY created_at DESC`,
        [customer_id]
      );
    } catch (err) {
      if (err.message && err.message.includes('measurement_profiles')) {
        return res.status(200).json({ profiles: [] });
      }
      throw err;
    }
    return res.status(200).json({ profiles: rows || [] });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get measurement profiles error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function createProfile(req, res) {
  try {
    const user = requireRole(['admin', 'manager', 'tailor'])(req);
    const body = req.body || {};
    const { customer_id, name, profile_type = 'custom', notes } = body;
    if (!customer_id || !name) {
      return res.status(400).json({ error: 'customer_id and name required' });
    }
    try {
      const result = await query(
        `INSERT INTO measurement_profiles (customer_id, name, profile_type, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING id, customer_id, name, profile_type, notes, created_at`,
        [customer_id, name, profile_type || 'custom', notes || null]
      );
      return res.status(201).json(result[0]);
    } catch (err) {
      if (err.message && err.message.includes('measurement_profiles')) {
        return res.status(501).json({ error: 'Measurement profiles not configured. Run database/schema_enhancements.sql' });
      }
      throw err;
    }
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Create measurement profile error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return getProfiles(req, res);
  if (req.method === 'POST') return createProfile(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
