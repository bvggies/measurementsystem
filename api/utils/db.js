/**
 * Database connection utility for Neon Postgres (JavaScript version for API routes)
 * Uses WHATWG URL API to parse DATABASE_URL to avoid Node url.parse() deprecation.
 */

const { Pool } = require('pg');

let pool = null;

function getPoolConfig(connectionString) {
  try {
    const u = new URL(connectionString);
    const database = u.pathname ? u.pathname.replace(/^\//, '').replace(/%2f/gi, '/') : undefined;
    const isLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    return {
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : 5432,
      database: database || undefined,
      user: u.username || undefined,
      password: u.password || undefined,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
    };
  } catch (_) {
    return {
      connectionString,
      ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
    };
  }
}

const initDb = () => {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  pool = new Pool(getPoolConfig(connectionString));

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
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
