/**
 * Database connection utility for Neon Postgres
 */

import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export const initDb = (): Pool => {
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

/**
 * Get database connection pool
 */
export const getDb = (): Pool => {
  if (!pool) {
    return initDb();
  }
  return pool;
};

/**
 * Execute a query with error handling
 */
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<T[]> => {
  const db = getDb();
  try {
    const result = await db.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Execute a transaction
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
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

/**
 * Close database connection pool
 */
export const closeDb = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

