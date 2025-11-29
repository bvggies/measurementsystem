/**
 * GET /api/activity-logs
 * Get activity/audit logs
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireRole(['admin', 'manager'])(req);

    const {
      page = '1',
      limit = '50',
      action = '',
      resource_type = '',
      user_id = '',
      fromDate = '',
      toDate = '',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (action) {
      whereConditions.push(`action = $${paramIndex}`);
      params.push(action);
      paramIndex++;
    }

    if (resource_type) {
      whereConditions.push(`resource_type = $${paramIndex}`);
      params.push(resource_type);
      paramIndex++;
    }

    if (user_id) {
      whereConditions.push(`user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }

    if (fromDate) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count, 10);

    // Get logs
    params.push(limitNum, offset);
    const logs = await query<any>(
      `SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return res.status(200).json({
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

