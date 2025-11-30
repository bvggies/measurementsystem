/**
 * POST /api/measurements/import/commit
 * Commit validated import rows to database
 * JavaScript version for Vercel compatibility
 */

const { query, transaction } = require('../../../utils/db');
const { requireRole } = require('../../../utils/auth');

// Note: processImportRows and autoMapColumns would need to be converted to JS
// For now, we'll handle basic validation inline
const processImportRows = (rows, columnMapping, defaultUnit) => {
  // Simplified version - in production, use the full validation from importParser
  return rows.map((row, index) => {
    const data = {};
    Object.keys(columnMapping).forEach(key => {
      const sourceKey = columnMapping[key];
      data[key] = row[sourceKey] || null;
    });
    data.units = data.units || defaultUnit;
    
    return {
      rowNumber: index + 1,
      data,
      isValid: true, // Simplified - add validation as needed
      errors: [],
    };
  });
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = requireRole(['admin', 'manager'])(req);

    const { importId, rows, columnMapping, fileName, defaultUnit = 'cm' } = req.body;

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Invalid request: rows array required' });
    }

    // Process and validate rows
    const processedRows = processImportRows(rows, columnMapping || {}, defaultUnit);

    // Filter valid rows
    const validRows = processedRows.filter((r) => r.isValid);
    const invalidRows = processedRows.filter((r) => !r.isValid);

    // Create import record (handle case where imports table might not exist)
    let importRecordId = importId || `import-${Date.now()}`;
    try {
      const importRecord = await query(
        `INSERT INTO imports (imported_by, file_name, status, total_rows, successful_rows, failed_rows)
         VALUES ($1, $2, 'pending', $3, 0, $4)
         RETURNING id`,
        [user.userId, fileName || 'import.csv', processedRows.length, invalidRows.length]
      );
      importRecordId = importRecord[0].id;
    } catch (err) {
      console.log('Could not create import record:', err.message);
    }

    // Insert valid rows in transaction
    let successCount = 0;
    const errors = [];

    await transaction(async (client) => {
      for (const row of validRows) {
        try {
          const data = row.data;

          // Find or create customer
          let customerId = null;
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
              data.across_back || null,
              data.chest || null,
              data.sleeve_length || null,
              data.around_arm || null,
              data.neck || null,
              data.top_length || null,
              data.wrist || null,
              data.trouser_waist || null,
              data.trouser_thigh || null,
              data.trouser_knee || null,
              data.trouser_length || null,
              data.trouser_bars || null,
              data.additional_info || null,
              data.branch || null,
            ]
          );

          successCount++;
        } catch (error) {
          errors.push({
            rowNumber: row.rowNumber,
            error: error.message,
          });
        }
      }
    });

    // Update import record if it exists
    try {
      await query(
        `UPDATE imports 
         SET status = $1, successful_rows = $2, failed_rows = $3, 
             report = $4, completed_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          'completed',
          successCount,
          invalidRows.length + errors.length,
          JSON.stringify({
            errors: [...invalidRows.map((r) => ({ rowNumber: r.rowNumber, errors: r.errors })), ...errors],
          }),
          importRecordId,
        ]
      );
    } catch (err) {
      console.log('Could not update import record:', err.message);
    }

    // Log audit
    try {
      await query(
        `INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, 'import', 'import', $2, $3)`,
        [user.userId, importRecordId, JSON.stringify({ fileName, successCount, failedCount: invalidRows.length + errors.length })]
      );
    } catch (err) {
      console.log('Could not log activity:', err.message);
    }

    return res.status(200).json({
      importId: importRecordId,
      successCount,
      failedCount: invalidRows.length + errors.length,
      errors: [...invalidRows.map((r) => ({ rowNumber: r.rowNumber, errors: r.errors })), ...errors],
    });
  } catch (error) {
    console.error('Commit import error:', error);
    if (error.message === 'Authentication required' || error.message === 'Insufficient permissions' || error.message === 'Invalid or expired token') {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};

