import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema';

const { Pool } = pkg;

// Declare global to cache the connection pool during development hot-reloads
declare global {
  var _postgresPool: any | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    let connectionString = (process.env.DATABASE_URL || '').trim();
    if ((connectionString.startsWith('"') && connectionString.endsWith('"')) || 
        (connectionString.startsWith("'") && connectionString.endsWith("'"))) {
      connectionString = connectionString.slice(1, -1).trim();
    }
    
    if (connectionString) {
      console.log('[CodeMind DB] Initializing connection pool with DATABASE_URL...');
      const needsSsl = connectionString.includes('sslmode=') || 
                       connectionString.includes('neon.tech') || 
                       connectionString.includes('supabase') || 
                       connectionString.includes('render.com') ||
                       connectionString.includes('aiven') ||
                       process.env.NODE_ENV === 'production';
      try {
        const poolInstance = new Pool({
          connectionString,
          max: 5,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
          ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
        });

        // Register error handler immediately on pool creation to avoid process crash
        poolInstance.on('error', (err) => {
          console.error('[CodeMind DB] Idle pool background error:', err?.message || err);
        });

        global._postgresPool = poolInstance;
      } catch (err) {
        console.error('[CodeMind DB] Exception initializing Pool:', err);
      }
    } else if (process.env.SQL_HOST) {
      console.log('[CodeMind DB] DATABASE_URL not found. Falling back to SQL_* environment variables...');
      try {
        const poolInstance = new Pool({
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          max: 5,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
        });

        poolInstance.on('error', (err) => {
          console.error('[CodeMind DB] Idle pool background error:', err?.message || err);
        });

        global._postgresPool = poolInstance;
      } catch (err) {
        console.error('[CodeMind DB] Exception initializing SQL_* Pool:', err);
      }
    }

    if (!global._postgresPool) {
      console.warn('[CodeMind DB] WARNING: No database credentials found. Operating in safe fallback mode.');
      // Create a dummy pool with immediate error handler to prevent unhandled 'error' events
      const dummyPool = new Pool({
        host: '127.0.0.1',
        port: 54321,
        connectionTimeoutMillis: 1000,
      });
      dummyPool.on('error', () => {
        // Prevent uncaught error event from crashing Node process
      });
      global._postgresPool = dummyPool;
    }
  }
  return global._postgresPool;
};

const pool = createPool();

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });
export { pool };
