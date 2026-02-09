/**
 * Database connection utility for Neon Postgres (JavaScript version for API routes)
 * Uses WHATWG URL API to parse DATABASE_URL to avoid Node url.parse() deprecation.
 */

const { Pool } = require('pg');

let pool = null;

function getPoolConfig(connectionString) {
  const str = String(connectionString || '').trim();
  const withProtocol = str.match(/^[a-z][a-z0-9+.-]*:\/\//i) ? str : `postgresql://${str}`;
  try {
    const u = new URL(withProtocol);
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
    const parsed = parseConnectionStringFallback(str);
    return {
      ...parsed,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
    };
  }
}

function parseConnectionStringFallback(str) {
  const isLocal = str.includes('localhost') || str.includes('127.0.0.1');
  const ssl = isLocal ? false : { rejectUnauthorized: false };
  const m = str.match(/^(?:postgres(?:ql)?:)?\/\/(?:([^:@]+):([^@]*)@)?([^:/]+)(?::(\d+))?\/?([^?]*)/);
  if (m) {
    const [, user, password, host, port, path] = m;
    let database = path ? path.replace(/^\//, '').trim() : undefined;
    if (database) {
      try {
        database = decodeURIComponent(database);
      } catch (_) {
        /* use as-is */
      }
    }
    return {
      host: host || 'localhost',
      port: port ? parseInt(port, 10) : 5432,
      database: database || undefined,
      user: user || undefined,
      password: password !== undefined && password !== '' ? password : undefined,
      ssl,
    };
  }
  return { host: 'localhost', port: 5432, database: undefined, user: undefined, password: undefined, ssl };
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
