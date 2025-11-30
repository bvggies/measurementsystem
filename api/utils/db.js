/**
 * Database connection utility for Neon Postgres (JavaScript version for API routes)
 */

const { Pool } = require('pg');

let pool = null;

const initDb = () => {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return pool;
};

const getDb = () => {
  if (!pool) {
    return initDb();
  }
  return pool;
};

const query = async (text, params) => {
  const db = getDb();
  try {
    const result = await db.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const transaction = async (callback) => {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { query, initDb, getDb, transaction };
