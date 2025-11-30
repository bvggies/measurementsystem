/**
 * GET /api/settings - Get system settings
 * PUT /api/settings - Update system settings
 * JavaScript version for Vercel compatibility
 */

const { query } = require('./utils/db');
const { requireAuth } = require('./utils/auth');

// GET /api/settings
async function getSettings(req, res) {
  try {
    // Settings can be viewed by all authenticated users, but only admin can modify
    const settings = await query(
      `SELECT * FROM system_settings ORDER BY id DESC LIMIT 1`
    );

    if (settings.length === 0 || !settings[0].settings) {
      // Return default settings if none exist
      return res.status(200).json({
        name: 'FitTrack',
        tagline: 'Tailoring Measurement System',
        websiteTitle: 'FitTrack - Tailoring Measurement System',
        logo: '/applogo.png',
        colors: {
          primaryNavy: '#0D2136',
          primaryGold: '#D4A643',
          steel: '#586577',
          softWhite: '#FAFAFA',
          emerald: '#00A68C',
          crimson: '#E43F52',
        },
        email: '',
        phone: '',
        address: '',
        currency: 'USD',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        defaultUnit: 'cm',
      });
    }

    const setting = settings[0];
    // Parse JSONB settings if it's a string, otherwise use as is
    const settingsData = typeof setting.settings === 'string' 
      ? JSON.parse(setting.settings) 
      : setting.settings;
    return res.status(200).json(settingsData);
  } catch (error) {
    console.error('Get settings error:', error);
    // Return default settings on error
    return res.status(200).json({
      name: 'FitTrack',
      tagline: 'Tailoring Measurement System',
      websiteTitle: 'FitTrack - Tailoring Measurement System',
      logo: '/applogo.png',
      colors: {
        primaryNavy: '#0D2136',
        primaryGold: '#D4A643',
        steel: '#586577',
        softWhite: '#FAFAFA',
        emerald: '#00A68C',
        crimson: '#E43F52',
      },
      email: '',
      phone: '',
      address: '',
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      defaultUnit: 'cm',
    });
  }
}

// PUT /api/settings
async function updateSettings(req, res) {
  try {
    const user = requireAuth(req);
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update settings' });
    }

    const settings = req.body;

    // Check if settings exist
    const existing = await query('SELECT id FROM system_settings ORDER BY id DESC LIMIT 1');

    if (existing.length > 0) {
      // Update existing settings
      await query(
        `UPDATE system_settings 
         SET settings = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
         WHERE id = $3`,
        [JSON.stringify(settings), user.userId, existing[0].id]
      );
    } else {
      // Create new settings
      await query(
        `INSERT INTO system_settings (settings, created_by, updated_by)
         VALUES ($1, $2, $2)`,
        [JSON.stringify(settings), user.userId]
      );
    }

    // Log activity
    try {
      await query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, 'update', 'settings', $2, $3)`,
        [user.userId, existing[0]?.id || 'new', JSON.stringify({ updated: Object.keys(settings) })]
      );
    } catch (err) {
      console.log('Could not log activity:', err.message);
    }

    return res.status(200).json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Update settings error:', error);
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return getSettings(req, res);
  } else if (req.method === 'PUT') {
    return updateSettings(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

