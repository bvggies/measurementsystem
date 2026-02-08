/**
 * Run migration files only (schema_updates.sql, schema_enhancements.sql).
 * Use when base schema already exists. For fresh DB, use: npm run setup-db
 *
 * DATABASE_URL or connection string as first arg.
 * Example: node scripts/migrate-db.js "postgresql://..."
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.argv[2] ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_RmuGETi0g3wU@ep-sweet-wind-ahq3i2eq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const MIGRATION_FILES = ['schema_updates.sql', 'schema_enhancements.sql'];

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log('Connecting to database...');
    for (const file of MIGRATION_FILES) {
      const filePath = path.join(__dirname, '../database', file);
      if (!fs.existsSync(filePath)) {
        console.log('Skipping', file, '(not found)');
        continue;
      }
      const sql = fs.readFileSync(filePath, 'utf-8');
      console.log('Running', file, '...');
      await pool.query(sql);
      console.log('  ✓', file, 'done.');
    }
    console.log('\n✅ Migrations applied successfully.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
