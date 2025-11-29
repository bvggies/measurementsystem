/**
 * GET /api/measurements/:id - Get single measurement
 * PUT /api/measurements/:id - Update measurement
 * DELETE /api/measurements/:id - Delete measurement
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
import { validateMeasurement } from '../../src/utils/validation';

// GET /api/measurements/:id
async function getMeasurement(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;

    const measurements = await query<any>(
      `SELECT 
        m.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.address as customer_address,
        u.name as created_by_name
       FROM measurements m
       LEFT JOIN customers c ON m.customer_id = c.id
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.id = $1`,
      [id]
    );

    if (measurements.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    const measurement = measurements[0];

    // Role-based access control
    if (user.role === 'customer') {
      // Customers can only view their own measurements
      const customer = await query('SELECT id FROM customers WHERE email = $1', [user.email]);
      if (customer.length === 0 || measurement.customer_id !== customer[0].id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (user.role === 'tailor') {
      // Tailors can only view their own measurements
      if (measurement.created_by !== user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    return res.status(200).json(measurement);
  } catch (error: any) {
    console.error('Get measurement error:', error);
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/measurements/:id
async function updateMeasurement(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Manager can update measurements
    if (user.role === 'manager' && req.method === 'PUT') {
      // Allow managers to update
    }

    // Get existing measurement
    const existing = await query('SELECT * FROM measurements WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    // Role-based access control
    if (user.role === 'tailor' && existing[0].created_by !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = req.body;

    // Validate measurement
    const validation = validateMeasurement(data, data.units || existing[0].units);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Update measurement (triggers history creation)
    await query(
      `UPDATE measurements SET
        units = COALESCE($1, units),
        across_back = COALESCE($2, across_back),
        chest = COALESCE($3, chest),
        sleeve_length = COALESCE($4, sleeve_length),
        around_arm = COALESCE($5, around_arm),
        neck = COALESCE($6, neck),
        top_length = COALESCE($7, top_length),
        wrist = COALESCE($8, wrist),
        trouser_waist = COALESCE($9, trouser_waist),
        trouser_thigh = COALESCE($10, trouser_thigh),
        trouser_knee = COALESCE($11, trouser_knee),
        trouser_length = COALESCE($12, trouser_length),
        trouser_bars = COALESCE($13, trouser_bars),
        additional_info = COALESCE($14, additional_info),
        branch = COALESCE($15, branch),
        version = version + 1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $16`,
      [
        data.units,
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
        data.branch,
        id,
      ]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'update', 'measurement', $2, $3)`,
      [user.userId, id, JSON.stringify({ changes: Object.keys(data) })]
    );

    return res.status(200).json({ message: 'Measurement updated successfully' });
  } catch (error: any) {
    console.error('Update measurement error:', error);
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/measurements/:id
async function deleteMeasurement(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireAuth(req);
    const { id } = req.query;

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete measurements' });
    }

    const existing = await query('SELECT * FROM measurements WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    await query('DELETE FROM measurements WHERE id = $1', [id]);

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'delete', 'measurement', $2, $3)`,
      [user.userId, id, JSON.stringify({ entry_id: existing[0].entry_id })]
    );

    return res.status(200).json({ message: 'Measurement deleted successfully' });
  } catch (error: any) {
    console.error('Delete measurement error:', error);
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return getMeasurement(req, res);
  } else if (req.method === 'PUT') {
    return updateMeasurement(req, res);
  } else if (req.method === 'DELETE') {
    return deleteMeasurement(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

