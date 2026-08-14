import { createPool } from './index';

let isInitialized = false;

export async function ensureDatabaseSchema() {
  if (isInitialized) return;
  const pool = createPool();
  try {
    const client = await pool.connect();
    try {
      // Create extensions safely if supported
      try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      } catch (e) {
        // Ignored if extension creation lacks permission
      }
      try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
      } catch (e) {
        // Ignored if vector extension is not available
      }
      
      // 1. Users
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // 2. Projects
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          github_url TEXT,
          status TEXT NOT NULL DEFAULT 'ready',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // 3. Repositories
      await client.query(`
        CREATE TABLE IF NOT EXISTS repositories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          owner TEXT NOT NULL,
          repository_name TEXT NOT NULL,
          github_url TEXT NOT NULL,
          default_branch TEXT NOT NULL DEFAULT 'main',
          language TEXT NOT NULL DEFAULT 'TypeScript',
          stars INTEGER NOT NULL DEFAULT 0,
          last_indexed_at TIMESTAMP,
          indexing_status TEXT NOT NULL DEFAULT 'idle',
          total_files INTEGER NOT NULL DEFAULT 0,
          processed_files INTEGER NOT NULL DEFAULT 0,
          skipped_files INTEGER NOT NULL DEFAULT 0,
          failed_files INTEGER NOT NULL DEFAULT 0,
          indexing_error TEXT,
          current_file TEXT,
          indexing_diagnostics TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // 4. Files
      await client.query(`
        CREATE TABLE IF NOT EXISTS files (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
          path TEXT NOT NULL,
          name TEXT NOT NULL,
          extension TEXT NOT NULL,
          language TEXT NOT NULL,
          size INTEGER NOT NULL DEFAULT 0,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // 5. Document Chunks
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          source_type TEXT NOT NULL,
          source_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          embedding text,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // 6. Conversations
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // 7. Messages
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // 8. SQL Queries
      await client.query(`
        CREATE TABLE IF NOT EXISTS sql_queries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          natural_language_question TEXT NOT NULL,
          generated_sql TEXT NOT NULL,
          execution_time REAL NOT NULL DEFAULT 0,
          row_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // 9. Evaluations
      await client.query(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          question TEXT NOT NULL,
          expected_answer TEXT NOT NULL,
          retrieved_context TEXT NOT NULL,
          generated_answer TEXT NOT NULL,
          relevance_score REAL NOT NULL DEFAULT 0,
          faithfulness_score REAL NOT NULL DEFAULT 0,
          context_relevance_score REAL NOT NULL DEFAULT 0,
          context_recall_score REAL NOT NULL DEFAULT 0,
          retrieval_score REAL NOT NULL DEFAULT 0,
          latency REAL NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          run_id TEXT,
          retrieval_recall REAL,
          citation_precision REAL,
          retrieval_latency_ms REAL,
          generation_latency_ms REAL,
          total_latency_ms REAL,
          reasoning TEXT
        );
      `);

      isInitialized = true;
      console.log('[CodeMind DB Bootstrapper] Database schema verified/initialized successfully.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('[CodeMind DB Bootstrapper] Could not auto-initialize tables:', err?.message || err);
  }
}
