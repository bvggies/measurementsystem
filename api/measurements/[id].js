/**
 * GET /api/measurements/:id - Get single measurement
 * PUT /api/measurements/:id - Update measurement
 * DELETE /api/measurements/:id - Delete measurement
 * JavaScript version for Vercel compatibility
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');
const { validateMeasurement } = require('../utils/validation');

// GET /api/measurements/:id
async function getMeasurement(req, res) {
  try {
    const user = requireAuth(req);
    // Vercel dynamic routes: id comes from req.query for [id].js files
    const id = req.query.id;

    const measurements = await query(
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
  } catch (error) {
    console.error('Get measurement error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// PUT /api/measurements/:id
async function updateMeasurement(req, res) {
  try {
    const user = requireAuth(req);
    const id = req.query.id;

    if (user.role === 'customer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
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

    // Basic validation - only check for required client info if updating customer info
    // Note: For edit, we don't require client info if it's not being updated
    // But if client_name or client_phone is provided, at least one should be valid
    if (data.client_name !== undefined || data.client_phone !== undefined) {
      const clientName = data.client_name || '';
      const clientPhone = data.client_phone || '';
      if (!clientName.trim() && !clientPhone.trim()) {
        return res.status(400).json({
          error: 'Either client name or phone number is required',
          errors: [{ field: 'client_info', message: 'Either client name or phone number is required' }],
        });
      }
    }

    // Validate measurement fields (but don't require any)
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
    try {
      await query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, 'update', 'measurement', $2, $3)`,
        [user.userId, id, JSON.stringify({ changes: Object.keys(data) })]
      );
    } catch (err) {
      console.log('Could not log activity:', err.message);
    }

    return res.status(200).json({ message: 'Measurement updated successfully' });
  } catch (error) {
    console.error('Update measurement error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// DELETE /api/measurements/:id
async function deleteMeasurement(req, res) {
  try {
    const user = requireAuth(req);
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: 'Measurement ID is required' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete measurements' });
    }

    // Get existing measurement with customer info for logging
    const existing = await query(
      `SELECT m.*, c.name as customer_name 
       FROM measurements m 
       LEFT JOIN customers c ON m.customer_id = c.id 
       WHERE m.id = $1`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    const measurement = existing[0];

    // Delete the measurement
    await query('DELETE FROM measurements WHERE id = $1', [id]);

    // Log audit
    try {
      await query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, 'delete', 'measurement', $2, $3)`,
        [
          user.userId, 
          id, 
          JSON.stringify({ 
            entry_id: measurement.entry_id,
            customer_name: measurement.customer_name 
          })
        ]
      );
    } catch (err) {
      console.log('Could not log activity:', err.message);
      // Don't fail the delete if logging fails
    }

    return res.status(200).json({ 
      message: 'Measurement deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Delete measurement error:', error);
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: 'Failed to delete measurement',
      message: error.message || 'Internal server error'
    });
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return getMeasurement(req, res);
  } else if (req.method === 'PUT') {
    return updateMeasurement(req, res);
  } else if (req.method === 'DELETE') {
    return deleteMeasurement(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

