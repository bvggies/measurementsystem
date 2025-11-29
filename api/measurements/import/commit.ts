/**
 * POST /api/measurements/import/commit
 * Commit validated import rows to database
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
import { requireRole } from '../../src/utils/auth';
import { processImportRows, autoMapColumns } from '../../src/utils/importParser';
// Entry ID generation handled inline

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireRole(['admin'])(req);

    const { importId, rows, columnMapping, fileName, defaultUnit = 'cm' } = req.body;

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Invalid request: rows array required' });
    }

    // Process and validate rows again
    const processedRows = processImportRows(rows, columnMapping || {}, defaultUnit);

    // Filter valid rows
    const validRows = processedRows.filter((r) => r.isValid);
    const invalidRows = processedRows.filter((r) => !r.isValid);

    // Create import record
    const importRecord = await query<{ id: string }>(
      `INSERT INTO imports (imported_by, file_name, status, total_rows, successful_rows, failed_rows)
       VALUES ($1, $2, 'pending', $3, 0, $4)
       RETURNING id`,
      [user.userId, fileName || 'import.csv', processedRows.length, invalidRows.length]
    );

    const importRecordId = importRecord[0].id;

    // Insert valid rows in transaction
    let successCount = 0;
    const errors: any[] = [];

    await transaction(async (client) => {
      for (const row of validRows) {
        try {
          const data = row.data;

          // Find or create customer
          let customerId: string | null = null;
          if (data.client_name || data.client_phone) {
            const existingCustomers = await client.query(
              `SELECT id FROM customers 
               WHERE (phone = $1 AND $1 IS NOT NULL) 
                  OR (email = $2 AND $2 IS NOT NULL AND $2 != '')
               LIMIT 1`,
              [data.client_phone, data.client_email]
            );

            if (existingCustomers.rows.length > 0) {
              customerId = existingCustomers.rows[0].id;
            } else {
              const newCustomers = await client.query(
                `INSERT INTO customers (name, phone, email, address)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [data.client_name || 'Unknown', data.client_phone, data.client_email, data.client_address]
              );
              customerId = newCustomers.rows[0].id;
            }
          }

          // Generate entry_id if not provided
          const entryId = data.entry_id || `ENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Insert measurement
          await client.query(
            `INSERT INTO measurements (
              customer_id, created_by, entry_id, units,
              across_back, chest, sleeve_length, around_arm, neck, top_length, wrist,
              trouser_waist, trouser_thigh, trouser_knee, trouser_length, trouser_bars,
              additional_info, branch, version
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 1
            )`,
            [
              customerId,
              user.userId,
              entryId,
              data.units || defaultUnit,
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
            ]
          );

          successCount++;
        } catch (error: any) {
          errors.push({
            rowNumber: row.rowNumber,
            error: error.message,
          });
        }
      }
    });

    // Update import record
    await query(
      `UPDATE imports 
       SET status = $1, successful_rows = $2, failed_rows = $3, 
           report = $4, completed_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        errors.length === 0 ? 'completed' : 'completed',
        successCount,
        invalidRows.length + errors.length,
        JSON.stringify({
          errors: [...invalidRows.map((r) => ({ rowNumber: r.rowNumber, errors: r.errors })), ...errors],
        }),
        importRecordId,
      ]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'import', 'import', $2, $3)`,
      [user.userId, importRecordId, JSON.stringify({ fileName, successCount, failedCount: invalidRows.length + errors.length })]
    );

    return res.status(200).json({
      importId: importRecordId,
      successCount,
      failedCount: invalidRows.length + errors.length,
      errors: [...invalidRows.map((r) => ({ rowNumber: r.rowNumber, errors: r.errors })), ...errors],
    });
  } catch (error: any) {
    console.error('Commit import error:', error);
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions') {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

