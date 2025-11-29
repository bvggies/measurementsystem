/**
 * GET /api/measurements - List measurements with pagination and filters
 * POST /api/measurements - Create new measurement
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
import { query, transaction } from '../../src/utils/db';
import { requireAuth } from '../../src/utils/auth';
import { validateMeasurement } from '../../src/utils/validation';
// Entry ID generation handled inline

// GET /api/measurements
async function getMeasurements(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireAuth(req);

    const {
      page = '1',
      limit = '20',
      search = '',
      branch = '',
      unit = '',
      tailor = '',
      status = '',
      fromDate = '',
      toDate = '',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'tailor') {
      whereConditions.push(`m.created_by = $${paramIndex}`);
      params.push(user.userId);
      paramIndex++;
    }

    // Search filter
    if (search) {
      whereConditions.push(
        `(c.name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex} OR m.entry_id ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Branch filter
    if (branch) {
      whereConditions.push(`m.branch = $${paramIndex}`);
      params.push(branch);
      paramIndex++;
    }

    // Unit filter
    if (unit) {
      whereConditions.push(`m.units = $${paramIndex}`);
      params.push(unit);
      paramIndex++;
    }

    // Tailor filter
    if (tailor) {
      whereConditions.push(`m.created_by = $${paramIndex}`);
      params.push(tailor);
      paramIndex++;
    }

    // Date range filter
    if (fromDate) {
      whereConditions.push(`m.created_at >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }
    if (toDate) {
      whereConditions.push(`m.created_at <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM measurements m
       LEFT JOIN customers c ON m.customer_id = c.id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult[0].count, 10);

    // Get measurements
    params.push(limitNum, offset);
    const measurements = await query<any>(
      `SELECT 
        m.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        u.name as created_by_name
       FROM measurements m
       LEFT JOIN customers c ON m.customer_id = c.id
       LEFT JOIN users u ON m.created_by = u.id
       WHERE ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return res.status(200).json({
      data: measurements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get measurements error:', error);
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/measurements
async function createMeasurement(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireAuth(req);

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const data = req.body;

    // Validate measurement
    const validation = validateMeasurement(data, data.units || 'cm');
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Generate entry_id if not provided
    const entryId = data.entry_id || `ENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Find or create customer
    let customerId: string | null = null;
    if (data.client_name || data.client_phone) {
      const existingCustomers = await query<{ id: string }>(
        `SELECT id FROM customers 
         WHERE (phone = $1 AND $1 IS NOT NULL) 
            OR (email = $2 AND $2 IS NOT NULL AND $2 != '')
         LIMIT 1`,
        [data.client_phone, data.client_email]
      );

      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
        // Update customer info if provided
        if (data.client_name || data.client_email || data.client_address) {
          await query(
            `UPDATE customers 
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 address = COALESCE($3, address),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [data.client_name, data.client_email, data.client_address, customerId]
          );
        }
      } else {
        const newCustomers = await query<{ id: string }>(
          `INSERT INTO customers (name, phone, email, address)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [data.client_name || 'Unknown', data.client_phone, data.client_email, data.client_address]
        );
        customerId = newCustomers[0].id;
      }
    }

    // Create measurement
    const result = await query<{ id: string }>(
      `INSERT INTO measurements (
        customer_id, created_by, entry_id, units,
        across_back, chest, sleeve_length, around_arm, neck, top_length, wrist,
        trouser_waist, trouser_thigh, trouser_knee, trouser_length, trouser_bars,
        additional_info, branch, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 1
      ) RETURNING id`,
      [
        customerId,
        user.userId,
        entryId,
        data.units || 'cm',
        data.across_back,
        data.chest,
        data.sleeve_length,
        data.around_arm,
        data.neck,
        data.top_length,
        data.wrist,
        data.trouser_waist,
        data.trouser_thigh,
        data.trouser_knee,
        data.trouser_length,
        data.trouser_bars,
        data.additional_info,
        data.branch || (user.role !== 'admin' ? (await query('SELECT branch FROM users WHERE id = $1', [user.userId]))[0]?.branch : null),
      ]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'create', 'measurement', $2, $3)`,
      [user.userId, result[0].id, JSON.stringify({ entry_id: entryId })]
    );

    return res.status(201).json({
      id: result[0].id,
      entry_id: entryId,
      message: 'Measurement created successfully',
    });
  } catch (error: any) {
    console.error('Create measurement error:', error);
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getMeasurements(req, res);
  } else if (req.method === 'POST') {
    return createMeasurement(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

