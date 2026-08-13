import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pkg;

// Declare global to cache the connection pool during development hot-reloads
declare global {
  var _postgresPool: any | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (connectionString) {
      console.log('[CodeMind DB] Initializing connection pool with DATABASE_URL...');
      global._postgresPool = new Pool({
        connectionString,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else if (process.env.SQL_HOST) {
      console.log('[CodeMind DB] DATABASE_URL not found. Falling back to SQL_* environment variables...');
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      console.warn('[CodeMind DB] WARNING: No database credentials (DATABASE_URL or SQL_*) found in environment.');
      // Create a dummy pool that will fail lazily on query invocation instead of crashing the server on startup
      global._postgresPool = new Pool({
        max: 1,
        connectionTimeoutMillis: 1000,
      });
    }

    // Guard against idle client errors
    global._postgresPool.on('error', (err) => {
      console.error('[CodeMind DB] Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });
export { pool };
