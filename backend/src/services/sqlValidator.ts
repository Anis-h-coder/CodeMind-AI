export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  normalizedSql: string;
}

// Strictly forbidden SQL keywords that mutate database state or perform administrative/system operations
const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'GRANT',
  'REVOKE',
  'COMMENT',
  'VACUUM',
  'CALL',
  'DO',
  'COPY',
  'LOCK',
  'EXECUTE',
  'PREPARE',
  'DEALLOCATE',
  'REINDEX',
  'REFRESH',
  'EXPLAIN ANALYZE', // EXPLAIN without ANALYZE is fine, but ANALYZE actually executes the query
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'SAVEPOINT',
  'SET',
  'RESET',
  'SHOW',
];

// Dangerous PostgreSQL system functions that access files, process management, or sleep
const FORBIDDEN_FUNCTIONS = [
  'PG_READ_FILE',
  'PG_WRITE_FILE',
  'PG_LS_DIR',
  'PG_STAT_FILE',
  'PG_TERMINATE_BACKEND',
  'PG_CANCEL_BACKEND',
  'PG_SLEEP',
  'PG_EXEC',
  'PG_READ_BINARY_FILE',
  'LO_IMPORT',
  'LO_EXPORT',
  'DBLINK',
];

/**
 * Strips comments and normalizes SQL string.
 */
export function normalizeSql(sql: string): string {
  if (!sql) return '';

  // 1. Remove single line comments (-- ...)
  let cleaned = sql.replace(/--.*$/gm, '');

  // 2. Remove multi-line comments (/* ... */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. Trim whitespace
  cleaned = cleaned.trim();

  // 4. Remove trailing semicolon if present
  if (cleaned.endsWith(';')) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  return cleaned;
}

/**
 * Validates generated SQL against read-only security constraints.
 */
export function validateSql(rawSql: string): ValidationResult {
  if (!rawSql || typeof rawSql !== 'string') {
    return {
      isValid: false,
      reason: 'SQL query string is empty or invalid',
      normalizedSql: '',
    };
  }

  const normalized = normalizeSql(rawSql);

  if (!normalized) {
    return {
      isValid: false,
      reason: 'SQL query contains no executable statements',
      normalizedSql: '',
    };
  }

  // Check 1: Prevent multiple statements (e.g., semicolon injection)
  if (normalized.includes(';')) {
    return {
      isValid: false,
      reason: 'Query rejected: Multiple SQL statements in a single query are strictly prohibited. SQL Copilot only allows safe read-only queries.',
      normalizedSql: normalized,
    };
  }

  const uppercaseSql = normalized.toUpperCase();

  // Check 2: Must start with SELECT or WITH
  if (!uppercaseSql.startsWith('SELECT') && !uppercaseSql.startsWith('WITH')) {
    const firstWord = uppercaseSql.split(/\s+/)[0];
    let msg = 'Query rejected: This operation is not permitted. SQL Copilot only allows safe read-only PostgreSQL queries.';
    if (['DELETE', 'UPDATE', 'INSERT', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'REPLACE', 'GRANT', 'REVOKE'].includes(firstWord)) {
      msg = `Query rejected: ${firstWord} operations are not permitted. SQL Copilot only allows safe read-only queries.`;
    }
    return {
      isValid: false,
      reason: msg,
      normalizedSql: normalized,
    };
  }

  // Check 3: Check forbidden keywords using word boundary regex to prevent false positives in column/table names
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(normalized)) {
      let msg = `Query rejected: '${keyword}' operations are not permitted. SQL Copilot only allows safe read-only queries.`;
      if (['DELETE', 'UPDATE', 'INSERT', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'REPLACE', 'GRANT', 'REVOKE'].includes(keyword.toUpperCase())) {
        msg = `Query rejected: ${keyword.toUpperCase()} operations are not permitted. SQL Copilot only allows safe read-only queries.`;
      }
      return {
        isValid: false,
        reason: msg,
        normalizedSql: normalized,
      };
    }
  }

  // Check 4: Check forbidden system functions
  for (const fn of FORBIDDEN_FUNCTIONS) {
    const regex = new RegExp(`\\b${fn}\\b`, 'i');
    if (regex.test(normalized)) {
      return {
        isValid: false,
        reason: `Forbidden system function detected: '${fn}'`,
        normalizedSql: normalized,
      };
    }
  }

  // Check 5: Check SELECT INTO pattern (which creates a new table)
  if (/\bSELECT\b[\s\S]*?\bINTO\b[\s\S]*?\bFROM\b/i.test(normalized)) {
    return {
      isValid: false,
      reason: "'SELECT INTO' table creation syntax is strictly prohibited",
      normalizedSql: normalized,
    };
  }

  return {
    isValid: true,
    normalizedSql: normalized,
  };
}
