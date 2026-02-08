/**
 * GET /api/templates - List measurement templates (shirt, suit, dress, pants, regional)
 * POST /api/templates - Create template (admin/manager)
 */

const { query } = require('../utils/db');
const { requireAuth, requireRole } = require('../utils/auth');

const TEMPLATE_FIELDS = [
  'id', 'name', 'description', 'template_type', 'region', 'is_system', 'units',
  'across_back', 'chest', 'sleeve_length', 'around_arm', 'neck', 'top_length', 'wrist',
  'trouser_waist', 'trouser_thigh', 'trouser_knee', 'trouser_length', 'trouser_bars',
  'created_at', 'updated_at'
];

async function getTemplates(req, res) {
  try {
    requireAuth(req);
    const { type = '', region = '' } = req.query || {};
    let sql = 'SELECT * FROM measurement_templates WHERE 1=1';
    const params = [];
    let i = 1;
    if (type) {
      sql += ` AND (template_type = $${i} OR template_type IS NULL)`;
      params.push(type);
      i++;
    }
    if (region) {
      sql += ` AND (region = $${i} OR region IS NULL)`;
      params.push(region);
      i++;
    }
    sql += ' ORDER BY name';
    let rows;
    try {
      rows = await query(sql, params);
    } catch (colErr) {
      if (colErr.message && (colErr.message.includes('template_type') || colErr.message.includes('region'))) {
        rows = await query('SELECT * FROM measurement_templates ORDER BY name', []);
      } else {
        throw colErr;
      }
    }
    const templates = (rows || []).map((r) => ({
      ...r,
      template_type: r.template_type || 'custom',
      region: r.region || '',
    }));
    return res.status(200).json({ templates });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get templates error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

async function createTemplate(req, res) {
  try {
    const user = requireRole(['admin', 'manager'])(req);
    const body = req.body || {};
    const name = body.name || 'Untitled Template';
    const description = body.description || null;
    const units = body.units || 'cm';
    const vals = [
      name, description, units,
      body.across_back ?? null, body.chest ?? null, body.sleeve_length ?? null,
      body.around_arm ?? null, body.neck ?? null, body.top_length ?? null, body.wrist ?? null,
      body.trouser_waist ?? null, body.trouser_thigh ?? null, body.trouser_knee ?? null,
      body.trouser_length ?? null, body.trouser_bars ?? null,
      user.userId
    ];
    const result = await query(
      `INSERT INTO measurement_templates (
        name, description, units,
        across_back, chest, sleeve_length, around_arm, neck, top_length, wrist,
        trouser_waist, trouser_thigh, trouser_knee, trouser_length, trouser_bars,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, name, description, units, across_back, chest, sleeve_length, around_arm, neck, top_length, wrist, trouser_waist, trouser_thigh, trouser_knee, trouser_length, trouser_bars, created_at`,
      vals
    );
    const row = result[0];
    return res.status(201).json({ ...row, template_type: body.template_type || 'custom', region: body.region || '' });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Create template error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return getTemplates(req, res);
  if (req.method === 'POST') return createTemplate(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};
