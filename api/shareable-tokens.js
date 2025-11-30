/**
 * POST /api/shareable-tokens - Create shareable form token
 * GET /api/shareable-tokens - List shareable tokens
 * JavaScript version for Vercel compatibility
 */

const { query } = require('./utils/db');
const { requireRole } = require('./utils/auth');
const crypto = require('crypto');

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

async function createToken(req, res) {
  try {
    const user = requireRole(['admin', 'manager'])(req);
    const { expiresInDays } = req.body;
    const token = generateToken();
    
    let expiresAt = null;
    if (expiresInDays) {
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + parseInt(expiresInDays));
      expiresAt = expiresDate.toISOString();
    }

    const result = await query(
      `INSERT INTO shareable_tokens (token, created_by, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [token, user.userId, expiresAt]
    );

    const shareUrl = `${process.env.REACT_APP_API_URL || req.headers.origin || 'http://localhost:3000'}/form/${token}`;

    return res.status(201).json({
      token: result[0].token,
      shareUrl,
      expiresAt: result[0].expires_at,
    });
  } catch (error) {
    console.error('Create token error:', error);
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to create token',
    });
  }
}

async function getTokens(req, res) {
  try {
    const user = requireRole(['admin', 'manager'])(req);
    
    const tokens = await query(
      `SELECT t.*, u.name as created_by_name
       FROM shareable_tokens t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.created_by = $1
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [user.userId]
    );

    return res.status(200).json({ tokens });
  } catch (error) {
    console.error('Get tokens error:', error);
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch tokens',
    });
  }
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      return await createToken(req, res);
    } else if (req.method === 'GET') {
      return await getTokens(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Route handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    });
  }
};

