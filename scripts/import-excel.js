/**
 * Script to clear all measurements and import from Excel file
 * Usage: node scripts/import-excel.js
 */

require('dotenv').config();
const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 5, // Limit pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10 second timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

async function importExcel() {
  let client;
  
  try {
    console.log('Starting import process...');
    
    // Read Excel file
    const excelPath = path.join(__dirname, '../assets/measurements-2024-06-14.xlsx');
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found at: ${excelPath}`);
    }
    
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} rows in Excel file`);
    
    // Clear all existing measurements first
    client = await pool.connect();
    console.log('Clearing existing measurements...');
    await client.query('DELETE FROM measurements');
    console.log('All measurements cleared');
    client.release();
    client = null;
    
    // Clear customers (optional - comment out if you want to keep customers)
    // await client.query('DELETE FROM customers');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process in batches to avoid connection timeouts
    const BATCH_SIZE = 25; // Reduced batch size for better stability
    
    for (let batchStart = 0; batchStart < data.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, data.length);
      const batch = data.slice(batchStart, batchEnd);
      
      // Get a new connection for each batch with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          if (!client) {
            client = await pool.connect();
          }
          break;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          console.log(`Connection failed, retrying... (${3 - retries}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
      }
      
      try {
        await client.query('BEGIN');
        
        for (let i = 0; i < batch.length; i++) {
          const row = batch[i];
          const rowIndex = batchStart + i;
          
          try {
        // Map Excel columns to database fields based on actual Excel structure
        const parseMeasurement = (value) => {
          if (!value) return null;
          // Handle values like "8.5/24" - take first number
          if (typeof value === 'string' && value.includes('/')) {
            const firstPart = value.split('/')[0].trim();
            const parsed = parseFloat(firstPart);
            return isNaN(parsed) ? null : parsed;
          }
          const parsed = parseFloat(value);
          return isNaN(parsed) ? null : parsed;
        };
        
        const measurementData = {
          client_name: row['Client Information (Name (Reference))'] || row['Top (Name (Reference))'] || row['Trouser (Name (Reference))'] || '',
          client_phone: String(row['Client Information (Phone Number)'] || row['Phone'] || row['Top (Phone Number)'] || row['Trouser (Phone Number)'] || '').trim(),
          client_email: '',
          client_address: '',
          units: 'cm', // Default to cm
          across_back: parseMeasurement(row['Across Back']),
          chest: parseMeasurement(row['Chest']),
          sleeve_length: parseMeasurement(row['Sleeve Lenght']), // Note: typo in Excel
          around_arm: parseMeasurement(row['Around Arm']),
          neck: parseMeasurement(row['Neck']),
          top_length: parseMeasurement(row['Top Length']),
          wrist: parseMeasurement(row['Wrist']),
          trouser_waist: parseMeasurement(row['Waist']),
          trouser_thigh: parseMeasurement(row['Thigh']),
          trouser_knee: parseMeasurement(row['Knee']),
          trouser_length: parseMeasurement(row['Trouser Length']),
          trouser_bars: parseMeasurement(row['Bars']),
          additional_info: row['Additional Info'] || '',
          branch: '',
          entry_id: row['Entry Id'] ? String(row['Entry Id']) : `ENT-${Date.now()}-${i}`,
        };
        
        // Skip if no name or phone
        if (!measurementData.client_name && !measurementData.client_phone) {
          console.log(`Skipping row ${i + 1}: No name or phone`);
          errorCount++;
          continue;
        }
        
        // Find or create customer
        let customerId = null;
        if (measurementData.client_name || measurementData.client_phone) {
          const existingCustomers = await client.query(
            `SELECT id FROM customers 
             WHERE (phone = $1 AND $1 IS NOT NULL AND $1 != '') 
                OR (email = $2 AND $2 IS NOT NULL AND $2 != '')
             LIMIT 1`,
            [measurementData.client_phone, measurementData.client_email]
          );
          
          if (existingCustomers.rows.length > 0) {
            customerId = existingCustomers.rows[0].id;
            // Update customer info
            await client.query(
              `UPDATE customers 
               SET name = COALESCE($1, name),
                   email = COALESCE($2, email),
                   address = COALESCE($3, address),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $4`,
              [measurementData.client_name, measurementData.client_email, measurementData.client_address, customerId]
            );
          } else {
            const newCustomers = await client.query(
              `INSERT INTO customers (name, phone, email, address)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
              [
                measurementData.client_name || 'Unknown',
                measurementData.client_phone || null,
                measurementData.client_email || null,
                measurementData.client_address || null,
              ]
            );
            customerId = newCustomers.rows[0].id;
          }
        }
        
        // Create measurement
        // Use a default user ID (cache it to avoid repeated queries)
        let userId = null;
        if (!global.defaultUserId) {
          try {
            const defaultUserIdResult = await client.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
            global.defaultUserId = defaultUserIdResult.rows[0]?.id || null;
          } catch (err) {
            console.log('Could not get default user, continuing without created_by');
            global.defaultUserId = null;
          }
        }
        userId = global.defaultUserId;
        
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
            userId,
            measurementData.entry_id,
            measurementData.units || 'cm',
            measurementData.across_back,
            measurementData.chest,
            measurementData.sleeve_length,
            measurementData.around_arm,
            measurementData.neck,
            measurementData.top_length,
            measurementData.wrist,
            measurementData.trouser_waist,
            measurementData.trouser_thigh,
            measurementData.trouser_knee,
            measurementData.trouser_length,
            measurementData.trouser_bars,
            measurementData.additional_info || null,
            measurementData.branch || null,
          ]
        );
        
            successCount++;
          } catch (err) {
            console.error(`Error processing row ${rowIndex + 1}:`, err.message);
            errorCount++;
          }
        }
        
        // Commit batch
        await client.query('COMMIT');
        console.log(`✅ Processed batch ${Math.floor(batchStart / BATCH_SIZE) + 1} (rows ${batchStart + 1}-${batchEnd}/${data.length}) - Success: ${successCount}, Errors: ${errorCount}`);
        
      } catch (err) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackErr) {
          console.error('Rollback error:', rollbackErr.message);
        }
        console.error(`❌ Error in batch ${Math.floor(batchStart / BATCH_SIZE) + 1}:`, err.message);
        errorCount += batch.length;
      } finally {
        // Release connection after each batch
        if (client) {
          try {
            client.release();
          } catch (releaseErr) {
            console.error('Error releasing connection:', releaseErr.message);
          }
          client = null;
        }
        // Small delay between batches to prevent overwhelming the connection
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n✅ Import completed!');
    console.log(`✅ Successfully imported: ${successCount} measurements`);
    console.log(`❌ Errors: ${errorCount} rows`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run import
importExcel()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

