/**
 * GET /api/settings - Get system settings
 * PUT /api/settings - Update system settings
 * JavaScript version for Vercel compatibility
 */

const { query } = require('./utils/db');
const { requireAuth } = require('./utils/auth');
const { logAudit } = require('./utils/audit');
const { handleCors } = require('./utils/cors');

// GET /api/settings
async function getSettings(req, res) {
  try {
    // Settings can be viewed by all authenticated users, but only admin can modify
    // Try to get settings, but don't require auth for GET
    let settings = [];
    try {
      settings = await query(
        `SELECT * FROM system_settings ORDER BY id DESC LIMIT 1`
      );
    } catch (dbError) {
      // Table missing (42P01) or other DB error: return defaults without failing
      if (dbError.code !== '42P01') {
        console.error('Database error in getSettings:', dbError);
      }
      settings = [];
    }

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
    console.error('Error stack:', error.stack);
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

    // Validate settings object
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data' });
    }

    // Check if settings exist (table may be missing if migration not run)
    let existing = [];
    try {
      existing = await query('SELECT id FROM system_settings ORDER BY id DESC LIMIT 1');
    } catch (dbError) {
      if (dbError.code === '42P01') {
        return res.status(503).json({
          error: 'Settings table not found',
          message: 'Please run database migration: add system_settings table (see database/schema.sql or schema_updates.sql).',
        });
      }
      console.error('Database error checking existing settings:', dbError);
      return res.status(500).json({
        error: 'Database error',
        message: dbError.message || 'Failed to check existing settings',
      });
    }

    try {
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
    } catch (dbError) {
      console.error('Database error saving settings:', dbError);
      return res.status(500).json({
        error: 'Database error',
        message: dbError.message || 'Failed to save settings',
        details: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }

    await logAudit(req, user.userId, 'update', 'settings', existing[0]?.id || null, { updated: Object.keys(settings) });

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
  if (handleCors(req, res)) return;
  // Set cache-control headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  try {
    if (req.method === 'GET') {
      return await getSettings(req, res);
    } else if (req.method === 'PUT') {
      return await updateSettings(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Settings route handler error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

