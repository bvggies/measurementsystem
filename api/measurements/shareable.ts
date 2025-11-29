/**
 * POST /api/measurements/shareable
 * Submit measurement from shareable form
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
import { validateMeasurement } from '../../src/utils/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shareToken, ...data } = req.body;

    // Verify share token
    if (shareToken) {
      const tokens = await query(
        'SELECT * FROM shareable_tokens WHERE token = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())',
        [shareToken]
      );

      if (tokens.length === 0) {
        return res.status(403).json({ error: 'Invalid or expired share token' });
      }
    }

    // Validate measurement
    const validation = validateMeasurement(data, data.units || 'cm');
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Generate entry_id
    const entryId = data.entry_id || `ENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Find or create customer
    let customerId: string | null = null;
    if (data.client_name || data.client_phone) {
      const existingCustomers = await query(
        `SELECT id FROM customers 
         WHERE (phone = $1 AND $1 IS NOT NULL) 
            OR (email = $2 AND $2 IS NOT NULL AND $2 != '')
         LIMIT 1`,
        [data.client_phone, data.client_email]
      );

      if (existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        const newCustomers = await query(
          `INSERT INTO customers (name, phone, email, address)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [data.client_name || 'Unknown', data.client_phone, data.client_email, data.client_address]
        );
        customerId = newCustomers[0].id;
      }
    }

    // Get creator from token or use system user
    let createdBy: string | null = null;
    if (shareToken) {
      const tokenData = await query('SELECT created_by FROM shareable_tokens WHERE token = $1', [shareToken]);
      if (tokenData.length > 0) {
        createdBy = tokenData[0].created_by;
      }
    }

    // Create measurement
    const result = await query(
      `INSERT INTO measurements (
        customer_id, created_by, entry_id, units,
        across_back, chest, sleeve_length, around_arm, neck, top_length, wrist,
        trouser_waist, trouser_thigh, trouser_knee, trouser_length, trouser_bars,
        additional_info, version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1
      ) RETURNING id`,
      [
        customerId,
        createdBy,
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
      ]
    );

    return res.status(201).json({
      id: result[0].id,
      entry_id: entryId,
      message: 'Measurement submitted successfully',
    });
  } catch (error: any) {
    console.error('Shareable form error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

