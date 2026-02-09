/**
 * GET /api/reports/summary
 * Get dashboard summary statistics
 * JavaScript version for Vercel compatibility
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { handleCors } = require('../utils/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireAuth(req);

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'tailor') {
      whereClause = `m.created_by = $${paramIndex}`;
      params.push(user.userId);
      paramIndex++;
    }
    // Managers and admins can see all data

    // Total customers
    const customersQuery = user.role === 'tailor'
      ? `SELECT COUNT(DISTINCT m.customer_id) as count FROM measurements m WHERE m.created_by = $1`
      : `SELECT COUNT(*) as count FROM customers`;
    const customersParams = user.role === 'tailor' ? [user.userId] : [];
    const customersResult = await query(customersQuery, customersParams);
    const totalCustomers = parseInt(customersResult[0]?.count || '0', 10);

    // Total measurements
    const measurementsQuery = `SELECT COUNT(*) as count FROM measurements m WHERE ${whereClause}`;
    const measurementsResult = await query(measurementsQuery, params);
    const totalMeasurements = parseInt(measurementsResult[0]?.count || '0', 10);

    // New entries (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const newEntriesParams = [...params, thirtyDaysAgo];
    const newEntriesQuery = `SELECT COUNT(*) as count FROM measurements m WHERE ${whereClause} AND m.created_at >= $${paramIndex}`;
    const newEntriesResult = await query(newEntriesQuery, newEntriesParams);
    const newEntries = parseInt(newEntriesResult[0]?.count || '0', 10);

    // Pending fittings (handle case where fittings table might not exist)
    let pendingFittings = 0;
    try {
      const fittingsParams = user.role === 'tailor' ? [user.userId] : [];
      const fittingsWhere = user.role === 'tailor' ? 'WHERE f.tailor_id = $1 AND' : 'WHERE';
      const fittingsQuery = `SELECT COUNT(*) as count FROM fittings f ${fittingsWhere} f.status = 'scheduled'`;
      const fittingsResult = await query(fittingsQuery, fittingsParams);
      pendingFittings = parseInt(fittingsResult[0]?.count || '0', 10);
    } catch (err) {
      // Fittings table might not exist yet, that's okay
      console.log('Fittings table not found, defaulting to 0');
    }

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activityParams = [...params, sevenDaysAgo];
    const activityQuery = `SELECT COUNT(*) as count FROM measurements m WHERE ${whereClause} AND m.created_at >= $${paramIndex}`;
    const activityResult = await query(activityQuery, activityParams);
    const recentActivity = parseInt(activityResult[0]?.count || '0', 10);

    const response = {
      totalCustomers,
      totalMeasurements,
      newEntries,
      pendingFittings,
      recentActivity,
    };

    // Tailor performance stats (admin/manager only)
    if (user.role === 'admin' || user.role === 'manager') {
      try {
        const tailorRows = await query(
          `SELECT u.id, u.name, u.email,
            COUNT(m.id) as measurements_count,
            COUNT(CASE WHEN m.updated_at > m.created_at THEN 1 END) as updates_count
           FROM users u
           LEFT JOIN measurements m ON m.created_by = u.id
           WHERE u.role = 'tailor'
           GROUP BY u.id, u.name, u.email
           ORDER BY measurements_count DESC`
        );
        response.tailorStats = tailorRows || [];
      } catch (e) {
        response.tailorStats = [];
      }

      // Customer growth: new in last 30d vs had measurement before
      try {
        const newCust = await query(
          'SELECT COUNT(*) as c FROM customers WHERE created_at >= $1',
          [thirtyDaysAgo]
        );
        const returningQuery = await query(
          `SELECT COUNT(DISTINCT customer_id) as c FROM measurements WHERE created_at < $1`,
          [thirtyDaysAgo]
        );
        response.customerGrowth = {
          newCustomersLast30Days: parseInt(newCust[0]?.c || '0', 10),
          returningCustomersWithMeasurements: parseInt(returningQuery[0]?.c || '0', 10),
        };
      } catch (e) {
        response.customerGrowth = { newCustomersLast30Days: 0, returningCustomersWithMeasurements: 0 };
      }

      // Measurement trends: simple avg of key fields (last 30d)
      try {
        const trendRows = await query(
          `SELECT AVG(chest) as avg_chest, AVG(trouser_waist) as avg_waist, AVG(neck) as avg_neck
           FROM measurements WHERE created_at >= $1 AND (chest IS NOT NULL OR trouser_waist IS NOT NULL OR neck IS NOT NULL)`,
          [thirtyDaysAgo]
        );
        response.measurementTrends = trendRows[0] || { avg_chest: null, avg_waist: null, avg_neck: null };
      } catch (e) {
        response.measurementTrends = { avg_chest: null, avg_waist: null, avg_neck: null };
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Summary error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

