/**
 * Seed script to import CSV data into database
 * Run with: npm run seed
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('papaparse');
const { Pool } = require('pg');

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use environment variables directly
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const parseNumeric = (value) => {
  if (!value || value.trim() === '' || value === '*') return null;
  // Handle ranges like "9/24" - take the first value
  const numStr = value.split('/')[0].trim();
  const parsed = parseFloat(numStr);
  return isNaN(parsed) ? null : parsed;
};

const normalizePhone = (phone) => {
  if (!phone || phone.trim() === '' || phone === '*') return null;
  return phone.replace(/[^\d+]/g, '') || null;
};

async function seed() {
  try {
    console.log('Starting seed process...');

    // Read CSV file
    const csvPath = path.join(__dirname, '../assets/measurements-2024-06-14 - measurements-2024-06-14.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const parseResult = parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    console.log(`Parsed ${parseResult.data.length} rows`);

    // Get or create default user (admin)
    let adminUserId;
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    
    if (userResult.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newUser = await pool.query(
        `INSERT INTO users (name, email, role, password_hash) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Admin User', 'admin@example.com', 'admin', hashedPassword]
      );
      adminUserId = newUser.rows[0].id;
      console.log('Created admin user');
    } else {
      adminUserId = userResult.rows[0].id;
      console.log('Using existing admin user');
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each row
    for (const row of parseResult.data) {
      try {
        // Handle various column name formats
        const clientName = (
          row['Client Information (Name (Reference))'] ||
          row['Client Name'] ||
          row['Name'] ||
          ''
        )?.trim() || 'Unknown';
        
        const clientPhone = normalizePhone(
          row['Client Information (Phone Number)'] ||
          row['Client Phone'] ||
          row['Phone'] ||
          row['Phone Number'] ||
          ''
        );

        // Find or create customer
        let customerId = null;
        if (clientPhone) {
          const existingCustomer = await pool.query(
            'SELECT id FROM customers WHERE phone = $1 LIMIT 1',
            [clientPhone]
          );

          if (existingCustomer.rows.length > 0) {
            customerId = existingCustomer.rows[0].id;
          } else {
            const newCustomer = await pool.query(
              `INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING id`,
              [clientName, clientPhone]
            );
            customerId = newCustomer.rows[0].id;
          }
        } else if (clientName !== 'Unknown') {
          // Create customer with just name if no phone
          const newCustomer = await pool.query(
            `INSERT INTO customers (name) VALUES ($1) RETURNING id`,
            [clientName]
          );
          customerId = newCustomer.rows[0].id;
        }

        // Get entry ID or generate one
        const entryId = row['Entry Id'] || `ENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Insert measurement - handle various column name formats
        await pool.query(
          `INSERT INTO measurements (
            customer_id, created_by, entry_id, units,
            across_back, chest, sleeve_length, around_arm, neck, top_length, wrist,
            trouser_waist, trouser_thigh, trouser_knee, trouser_length, trouser_bars,
            additional_info, version
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1
          )`,
          [
            customerId,
            adminUserId,
            entryId,
            'cm', // Default to cm
            parseNumeric(row['Across Back'] || row['across_back']),
            parseNumeric(row['Chest'] || row['chest']),
            parseNumeric(row['Sleeve Lenght'] || row['Sleeve Length'] || row['sleeve_length']),
            parseNumeric(row['Around Arm'] || row['around_arm']),
            parseNumeric(row['Neck'] || row['neck']),
            parseNumeric(row['Top Length'] || row['top_length']),
            parseNumeric(row['Wrist'] || row['wrist']),
            parseNumeric(row['Waist'] || row['Trouser Waist'] || row['trouser_waist']),
            parseNumeric(row['Thigh'] || row['Trouser Thigh'] || row['trouser_thigh']),
            parseNumeric(row['Knee'] || row['Trouser Knee'] || row['trouser_knee']),
            parseNumeric(row['Trouser Length'] || row['trouser_length']),
            parseNumeric(row['Bars'] || row['Trouser Bars'] || row['trouser_bars']),
            row['Additional Info'] || row['additional_info'] || null,
          ]
        );

        successCount++;
        if (successCount % 100 === 0) {
          console.log(`Processed ${successCount} rows...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error processing row:`, error.message);
      }
    }

    console.log(`\nSeed completed!`);
    console.log(`Successfully imported: ${successCount} measurements`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();

