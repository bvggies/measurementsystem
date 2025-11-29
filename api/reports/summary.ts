/**
 * GET /api/reports/summary
 * Get dashboard summary statistics
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
import { query } from '../../src/utils/db';
import { requireAuth } from '../../src/utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req);

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'tailor') {
      whereClause = `m.created_by = $${paramIndex}`;
      params.push(user.userId);
      paramIndex++;
    }

    // Total customers
    const customersQuery = user.role === 'tailor'
      ? `SELECT COUNT(DISTINCT m.customer_id) as count FROM measurements m WHERE m.created_by = $1`
      : `SELECT COUNT(*) as count FROM customers`;
    const customersResult = await query<{ count: string }>(customersQuery, user.role === 'tailor' ? [user.userId] : []);
    const totalCustomers = parseInt(customersResult[0].count, 10);

    // Total measurements
    const measurementsQuery = `SELECT COUNT(*) as count FROM measurements m WHERE ${whereClause}`;
    const measurementsResult = await query<{ count: string }>(measurementsQuery, params);
    const totalMeasurements = parseInt(measurementsResult[0].count, 10);

    // New entries (last 30 days)
    params.push(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    const newEntriesQuery = `SELECT COUNT(*) as count FROM measurements m WHERE ${whereClause} AND m.created_at >= $${paramIndex}`;
    const newEntriesResult = await query<{ count: string }>(newEntriesQuery, params);
    const newEntries = parseInt(newEntriesResult[0].count, 10);

    // Pending fittings
    const fittingsParams = user.role === 'tailor' ? [user.userId] : [];
    const fittingsWhere = user.role === 'tailor' ? 'WHERE f.tailor_id = $1' : '';
    const fittingsQuery = `SELECT COUNT(*) as count FROM fittings f ${fittingsWhere} AND f.status = 'scheduled'`;
    const fittingsResult = await query<{ count: string }>(fittingsQuery, fittingsParams);
    const pendingFittings = parseInt(fittingsResult[0].count, 10);

    // Recent activity (last 7 days)
    const activityParams = [...params.slice(0, -1), new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()];
    const activityQuery = `SELECT COUNT(*) as count FROM measurements m WHERE ${whereClause} AND m.created_at >= $${paramIndex}`;
    const activityResult = await query<{ count: string }>(activityQuery, activityParams);
    const recentActivity = parseInt(activityResult[0].count, 10);

    return res.status(200).json({
      totalCustomers,
      totalMeasurements,
      newEntries,
      pendingFittings,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Summary error:', error);
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

