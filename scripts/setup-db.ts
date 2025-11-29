/**
 * Setup database schema
 * Run with: npx ts-node scripts/setup-db.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_RmuGETi0g3wU@ep-sweet-wind-ahq3i2eq-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Read schema SQL file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Running schema SQL...');
    
    // Execute schema SQL
    await pool.query(schemaSQL);

    console.log('✅ Database schema created successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run seed (to import CSV data)');
    console.log('2. Or create an admin user manually in the database');
    
  } catch (error: any) {
    console.error('❌ Error setting up database:', error.message);
    if (error.code === '42P07') {
      console.log('Note: Some tables may already exist. This is okay.');
    } else {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

setupDatabase();

