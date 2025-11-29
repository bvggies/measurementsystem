/**
 * POST /api/shareable-tokens - Create shareable form token
 * GET /api/shareable-tokens - List shareable tokens
 */

// Vercel serverless function types
interface VercelRequest {
  method?: string;
  body?: any;
  query?: any;
  headers?: any;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
}

import { query } from '../src/utils/db';
import { requireRole } from '../src/utils/auth';

// Generate random token
const generateToken = () => {
  return `fittrack-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireRole(['admin', 'manager'])(req);

    if (req.method === 'POST') {
      // Create new shareable token
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
    } else if (req.method === 'GET') {
      // List shareable tokens
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
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Shareable token error:', error);
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

