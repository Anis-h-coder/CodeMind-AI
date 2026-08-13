import { pool } from '../db/index.ts';

export interface SqlExecutionResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
}

const DEFAULT_TIMEOUT_MS = parseInt(process.env.SQL_QUERY_TIMEOUT_MS || '5000', 10);
const DEFAULT_MAX_ROWS = parseInt(process.env.MAX_SQL_ROWS || '100', 10);

/**
 * Safely executes a read-only SQL query against PostgreSQL.
 * Enforces transaction-level READ ONLY isolation, statement timeout, and row limits.
 */
export async function executeReadOnlySql(
  sql: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  maxRows: number = DEFAULT_MAX_ROWS
): Promise<SqlExecutionResult> {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    // 1. Begin read-only transaction
    await client.query('BEGIN READ ONLY');

    // 2. Set statement timeout for this local transaction
    await client.query(`SET LOCAL statement_timeout = ${Math.min(timeoutMs, 10000)}`);

    // 3. Execute query
    const res = await client.query(sql);
    const executionTimeMs = Date.now() - startTime;

    // 4. Always rollback transaction (read-only safety mechanism)
    await client.query('ROLLBACK');

    const rawRows = res.rows || [];
    const limitedRows = rawRows.slice(0, maxRows);

    const columns = res.fields ? res.fields.map((f: any) => f.name) : (rawRows.length > 0 ? Object.keys(rawRows[0]) : []);

    return {
      columns,
      rows: limitedRows,
      rowCount: rawRows.length,
      executionTimeMs,
    };
  } catch (error: any) {
    // Rollback transaction on failure
    await client.query('ROLLBACK').catch(() => {});

    console.error('[SQL Execution Service] Query execution failed:', error.message);

    // Format error message cleanly for frontend
    let userMsg = error.message || 'Database query execution failed';
    if (userMsg.includes('canceling statement due to statement timeout')) {
      userMsg = `Query execution exceeded timeout limit of ${timeoutMs}ms`;
    }

    throw new Error(userMsg);
  } finally {
    client.release();
  }
}
