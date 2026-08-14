import { pool } from '../db/index';

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  foreignKeyRef?: string;
}

export interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
}

/**
 * Discovers actual PostgreSQL schema metadata dynamically from information_schema
 */
export async function discoverSchema(): Promise<TableInfo[]> {
  try {
    // 1. Fetch all base tables in public schema
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const tablesRes = await pool.query(tablesQuery);
    const tableNames: string[] = tablesRes.rows.map((r: any) => r.table_name);

    // 2. Fetch primary key constraint info
    const pkQuery = `
      SELECT kcu.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public';
    `;
    const pkRes = await pool.query(pkQuery);
    const pkMap = new Set<string>();
    for (const row of pkRes.rows) {
      pkMap.add(`${row.table_name}.${row.column_name}`);
    }

    // 3. Fetch foreign key constraint info
    const fkQuery = `
      SELECT
        kcu.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `;
    const fkRes = await pool.query(fkQuery);
    const fkMap = new Map<string, string>();
    for (const row of fkRes.rows) {
      fkMap.set(`${row.table_name}.${row.column_name}`, `${row.foreign_table_name}.${row.foreign_column_name}`);
    }

    // 4. Fetch columns for each table
    const result: TableInfo[] = [];

    for (const tName of tableNames) {
      const colQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      const colRes = await pool.query(colQuery, [tName]);

      const columns: ColumnInfo[] = colRes.rows.map((c: any) => {
        const keyStr = `${tName}.${c.column_name}`;
        const isPk = pkMap.has(keyStr);
        const fkRef = fkMap.get(keyStr);

        return {
          columnName: c.column_name,
          dataType: c.data_type,
          isNullable: c.is_nullable === 'YES',
          isPrimaryKey: isPk,
          foreignKeyRef: fkRef,
        };
      });

      result.push({
        tableName: tName,
        columns,
      });
    }

    return result;
  } catch (err) {
    console.error('[Schema Discovery] Failed to discover schema from information_schema:', err);
    // Fallback static metadata representation if DB discovery fails transiently
    return getFallbackSchema();
  }
}

/**
 * Formats table schema into a compact text string suitable for Gemini prompt context.
 * Masks or omits sensitive columns like password_hash.
 */
export async function getCompactSchemaContext(): Promise<string> {
  const tables = await discoverSchema();

  let context = 'Database Schema (PostgreSQL):\n\n';

  for (const table of tables) {
    context += `Table: ${table.tableName}\nColumns:\n`;
    for (const col of table.columns) {
      // Sensitive column filter
      if (col.columnName.toLowerCase().includes('password') || col.columnName.toLowerCase().includes('secret') || col.columnName.toLowerCase().includes('token')) {
        context += `  - ${col.columnName} (${col.dataType} - OMITTED FOR SECURITY)\n`;
        continue;
      }

      let colDesc = `  - ${col.columnName} (${col.dataType}`;
      if (col.isPrimaryKey) colDesc += ', PRIMARY KEY';
      if (col.foreignKeyRef) colDesc += `, FOREIGN KEY -> ${col.foreignKeyRef}`;
      if (!col.isNullable && !col.isPrimaryKey) colDesc += ', NOT NULL';
      colDesc += ')\n';

      context += colDesc;
    }
    context += '\n';
  }

  return context.trim();
}

/**
 * Fallback schema description in case information_schema query fails
 */
function getFallbackSchema(): TableInfo[] {
  return [
    {
      tableName: 'users',
      columns: [
        { columnName: 'id', dataType: 'uuid', isNullable: false, isPrimaryKey: true },
        { columnName: 'email', dataType: 'text', isNullable: false, isPrimaryKey: false },
        { columnName: 'name', dataType: 'text', isNullable: true, isPrimaryKey: false },
        { columnName: 'created_at', dataType: 'timestamp', isNullable: false, isPrimaryKey: false },
      ]
    },
    {
      tableName: 'projects',
      columns: [
        { columnName: 'id', dataType: 'uuid', isNullable: false, isPrimaryKey: true },
        { columnName: 'user_id', dataType: 'uuid', isNullable: false, isPrimaryKey: false, foreignKeyRef: 'users.id' },
        { columnName: 'name', dataType: 'text', isNullable: false, isPrimaryKey: false },
        { columnName: 'description', dataType: 'text', isNullable: true, isPrimaryKey: false },
        { columnName: 'created_at', dataType: 'timestamp', isNullable: false, isPrimaryKey: false },
      ]
    },
    {
      tableName: 'repositories',
      columns: [
        { columnName: 'id', dataType: 'uuid', isNullable: false, isPrimaryKey: true },
        { columnName: 'project_id', dataType: 'uuid', isNullable: false, isPrimaryKey: false, foreignKeyRef: 'projects.id' },
        { columnName: 'repository_name', dataType: 'text', isNullable: false, isPrimaryKey: false },
        { columnName: 'owner', dataType: 'text', isNullable: false, isPrimaryKey: false },
        { columnName: 'last_indexed_at', dataType: 'timestamp', isNullable: true, isPrimaryKey: false },
      ]
    },
    {
      tableName: 'files',
      columns: [
        { columnName: 'id', dataType: 'uuid', isNullable: false, isPrimaryKey: true },
        { columnName: 'project_id', dataType: 'uuid', isNullable: false, isPrimaryKey: false, foreignKeyRef: 'projects.id' },
        { columnName: 'repository_id', dataType: 'uuid', isNullable: false, isPrimaryKey: false, foreignKeyRef: 'repositories.id' },
        { columnName: 'path', dataType: 'text', isNullable: false, isPrimaryKey: false },
        { columnName: 'name', dataType: 'text', isNullable: false, isPrimaryKey: false },
        { columnName: 'extension', dataType: 'text', isNullable: true, isPrimaryKey: false },
        { columnName: 'size', dataType: 'integer', isNullable: false, isPrimaryKey: false },
      ]
    },
    {
      tableName: 'sql_queries',
      columns: [
        { columnName: 'id', dataType: 'uuid', isNullable: false, isPrimaryKey: true },
        { columnName: 'project_id', dataType: 'uuid', isNullable: false, isPrimaryKey: false, foreignKeyRef: 'projects.id' },
        { columnName: 'user_id', dataType: 'uuid', isNullable: false, isPrimaryKey: false, foreignKeyRef: 'users.id' },
        { columnName: 'natural_language_question', dataType: 'text', isNullable: false, isPrimaryKey: false },
        { columnName: 'generated_sql', dataType: 'text', isNullable: false, isPrimaryKey: false },
        { columnName: 'execution_time', dataType: 'real', isNullable: false, isPrimaryKey: false },
        { columnName: 'row_count', dataType: 'integer', isNullable: false, isPrimaryKey: false },
        { columnName: 'created_at', dataType: 'timestamp', isNullable: false, isPrimaryKey: false },
      ]
    }
  ];
}
