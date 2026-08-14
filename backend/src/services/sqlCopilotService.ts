import { GoogleGenAI } from "@google/genai";
import { getCompactSchemaContext } from './schemaService';
import { validateSql } from './sqlValidator';
import { executeReadOnlySql, SqlExecutionResult } from './sqlExecutionService';
import { db } from '../db/index';
import { sqlQueries } from '../db/schema';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
    });
  }
  return aiClient;
}

export interface SqlQueryResponse {
  question: string;
  sql: string;
  explanation: string;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
}

/**
 * System instruction required for Gemini SQL Copilot
 */
const SYSTEM_INSTRUCTION = `
You are an expert PostgreSQL database assistant.

Your goal is to generate valid, safe, read-only PostgreSQL queries based on the provided database schema.

AVAILABLE TABLES:
- users: User accounts (id, name, email, created_at, updated_at)
- projects: Code projects (id, user_id, name, description, github_url, status, created_at, updated_at)
- repositories: Git repositories connected to projects (id, project_id, owner, repository_name, github_url, default_branch, language, stars, last_indexed_at, indexing_status, total_files, processed_files, skipped_files, failed_files, created_at)
- files: Source code files inside repositories (id, repository_id, path, name, extension, language, size, content, created_at)
- document_chunks: Embedded RAG document chunks (id, project_id, source_type, source_name, file_path, chunk_index, content, created_at)
- conversations: Chat threads per project (id, project_id, user_id, title, created_at, updated_at)
- messages: Messages within chat conversations (id, conversation_id, role, content, created_at)
- sql_queries: History of generated SQL queries (id, project_id, user_id, natural_language_question, generated_sql, execution_time, row_count, created_at)
- evaluations: RAG accuracy & evaluation scores (id, project_id, question, expected_answer, retrieved_context, generated_answer, relevance_score, faithfulness_score, context_relevance_score, context_recall_score, retrieval_score, latency, created_at)

INSTRUCTIONS:
1. Always map natural language concepts flexibly to the relevant database table(s):
   - "code", "source code", "files", "scripts", "functions" -> files
   - "repos", "repositories", "codebases", "git" -> repositories
   - "projects", "apps", "workspaces" -> projects
   - "users", "authors", "members", "owners" -> users
   - "chats", "threads", "discussions", "conversations" -> conversations / messages
   - "chunks", "embeddings", "RAG documents", "contexts" -> document_chunks
   - "evaluations", "scores", "accuracy", "benchmarks", "latency" -> evaluations
   - "sql history", "query logs", "audit" -> sql_queries

2. Understand entity relationships for query generation:
   - "for each X" -> Requires GROUP BY X
   - "count X" -> Use COUNT(X)
   - "actual records" -> Query the underlying child table (e.g., files) rather than relying on summary columns in the parent table (e.g., repositories.total_files).
   - Foreign-key relationships -> Use JOINs.
   - FORBIDDEN: Do NOT use summary columns like 'repositories.total_files' when the user asks for 'actual' or 'stored' files. You MUST use a JOIN with the 'files' table and count the rows.

3. Mandatory Semantic Validation Step before generating SQL:
   a. Identify the entities mentioned in the question.
   b. Identify relevant tables.
   c. Identify foreign-key relationships.
   d. Determine requested aggregation.
   e. Verify that generated SQL correctly answers the question using joins and group-bys when appropriate.
   f. If the generated SQL relies on a summary column (e.g., 'repositories.total_files') when a JOIN with 'files' would be more accurate for 'actual files', discard it and generate a JOIN-based query instead.

4. Generate READ-ONLY PostgreSQL queries only (SELECT or WITH ... SELECT).
5. Do NOT generate any data mutation or administrative statements (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, REVOKE).
6. If the user asks for a data mutation, write, or destructive operation (such as DELETE, UPDATE, INSERT, DROP, TRUNCATE, ALTER), return a JSON object with error field:
{"error": "Query rejected: This operation is not permitted. SQL Copilot only allows safe read-only PostgreSQL queries."}
7. Include a LIMIT clause (default LIMIT 100) on queries that could return many rows.
8. If the user's request is completely unrelated to database queries or software application data, return a JSON object with error field explaining what data can be queried instead.

Respond ONLY with valid JSON in this exact structure:
{
  "reasoning": "Step-by-step semantic validation: Identify entities, tables, relationships, and requested aggregation. Explain the logic used to derive the query, including why a JOIN is necessary for counting actual records instead of using summary columns.",
  "sql": "SELECT ...",
  "explanation": "Clear, concise natural language explanation of what the query fetches.",
  "confidence": 0.95
}
`.trim();

export interface UnsafePromptResult {
  isUnsafe: boolean;
  operation?: string;
  reason?: string;
}

/**
 * Pre-checks user prompts for destructive or data mutating intent before execution.
 */
export function detectUnsafePrompt(question: string): UnsafePromptResult {
  if (!question || typeof question !== 'string') return { isUnsafe: false };
  const q = question.trim().toLowerCase();

  const startsWithReadQuery = /^(show|get|list|find|display|count|how many|what|which|search|view|select)\b/i.test(q);

  // 1. DELETE / ERASE / PURGE / REMOVE
  if (/\b(delete|erase|purge)\b/i.test(q) || (/\bremove\b/i.test(q) && /\b(users?|projects?|repositories|files|rows?|records?|tables?|database)\b/i.test(q))) {
    if (startsWithReadQuery && /\b(deleted|erased|purged|removed)\b/i.test(q) && !/\b(delete|erase|purge|remove)\s+(all|the|a|users?|projects?|repositories|files)\b/i.test(q)) {
      // Pass through e.g. "show deleted projects"
    } else {
      return {
        isUnsafe: true,
        operation: 'DELETE',
        reason: 'Query rejected: DELETE operations are not permitted. SQL Copilot only allows safe read-only queries.',
      };
    }
  }

  // 2. DROP
  if (/\bdrop\b/i.test(q)) {
    return {
      isUnsafe: true,
      operation: 'DROP',
      reason: 'Query rejected: DROP operations are not permitted. SQL Copilot only allows safe read-only queries.',
    };
  }

  // 3. TRUNCATE
  if (/\btruncate\b/i.test(q)) {
    return {
      isUnsafe: true,
      operation: 'TRUNCATE',
      reason: 'Query rejected: TRUNCATE operations are not permitted. SQL Copilot only allows safe read-only queries.',
    };
  }

  // 4. UPDATE / MODIFY / EDIT / SET
  if (/\b(update|modify)\b/i.test(q) || (/\bset\b/i.test(q) && /\b(status|name|email|description|role|owner)\s*=/i.test(q))) {
    if (startsWithReadQuery && /\b(updated|modified)\b/i.test(q) && !/\b(update|modify)\s+(all|the|a|users?|projects?|status)\b/i.test(q)) {
      // Pass through e.g. "show 10 most recently updated projects"
    } else {
      return {
        isUnsafe: true,
        operation: 'UPDATE',
        reason: 'Query rejected: UPDATE operations are not permitted. SQL Copilot only allows safe read-only queries.',
      };
    }
  }

  // 5. INSERT / ADD / CREATE (mutation intent)
  if (/\b(insert|add|create)\b/i.test(q)) {
    if (startsWithReadQuery && /\b(created|added|inserted)\b/i.test(q) && !/\b(insert|add|create)\s+(a|an|the|new|users?|projects?|row|record|table)\b/i.test(q)) {
      // Pass through e.g. "show projects created yesterday"
    } else {
      return {
        isUnsafe: true,
        operation: 'INSERT',
        reason: 'Query rejected: INSERT operations are not permitted. SQL Copilot only allows safe read-only queries.',
      };
    }
  }

  // 6. ALTER / GRANT / REVOKE / VACUUM / REINDEX
  if (/\b(alter|grant|revoke|vacuum|reindex)\b/i.test(q)) {
    return {
      isUnsafe: true,
      operation: 'ADMIN',
      reason: 'Query rejected: This operation is not permitted. SQL Copilot only allows safe read-only PostgreSQL queries.',
    };
  }

  return { isUnsafe: false };
}

/**
 * Fallback deterministic rule-based SQL generator for common read queries when Gemini API quota is reached
 */
function fallbackRuleBasedSQL(question: string): { sql: string; explanation: string; confidence: number } | null {
  const q = question.trim().toLowerCase();

  if (/\b(project|projects)\b/i.test(q)) {
    if (/\b(count|total|how many)\b/i.test(q)) {
      return {
        sql: 'SELECT COUNT(*) AS total_projects FROM projects;',
        explanation: 'Counts total number of projects in the system.',
        confidence: 0.85
      };
    }
    return {
      sql: 'SELECT id, name, description, status, created_at FROM projects ORDER BY created_at DESC LIMIT 10;',
      explanation: 'Fetches recent projects ordered by creation date.',
      confidence: 0.85
    };
  }

  if (/\b(repo|repos|repository|repositories)\b/i.test(q)) {
    if (/\b(count|total|how many)\b/i.test(q) && !/\b(for each|per)\b/i.test(q)) {
      return {
        sql: 'SELECT COUNT(*) AS total_repositories FROM repositories;',
        explanation: 'Counts total number of indexed repositories.',
        confidence: 0.85
      };
    }
    return {
      sql: 'SELECT id, owner, repository_name, project_id, language, stars FROM repositories LIMIT 100;',
      explanation: 'Lists indexed repositories with project associations.',
      confidence: 0.85
    };
  }

  if (/\b(file|files|code|scripts)\b/i.test(q)) {
    if (/\b(count|total|how many)\b/i.test(q) && !/\b(for each|per)\b/i.test(q)) {
      return {
        sql: 'SELECT COUNT(*) AS total_files FROM files;',
        explanation: 'Counts total indexed source code files.',
        confidence: 0.85
      };
    }
    return {
      sql: 'SELECT id, path, name, extension, language, size FROM files LIMIT 100;',
      explanation: 'Lists indexed source files and file details.',
      confidence: 0.85
    };
  }

  if (/\b(message|messages|chat|chats|conversations?)\b/i.test(q)) {
    if (/\b(count|total|how many)\b/i.test(q)) {
      return {
        sql: 'SELECT COUNT(*) AS total_messages FROM messages;',
        explanation: 'Counts total chat messages across conversations.',
        confidence: 0.85
      };
    }
    return {
      sql: 'SELECT id, project_id, user_id, title, created_at FROM conversations ORDER BY created_at DESC LIMIT 100;',
      explanation: 'Lists recent chat conversations.',
      confidence: 0.85
    };
  }

  if (/\b(evaluation|evaluations|score|scores|metrics)\b/i.test(q)) {
    return {
      sql: 'SELECT id, project_id, question, relevance_score, faithfulness_score, context_relevance_score, latency, created_at FROM evaluations ORDER BY created_at DESC LIMIT 100;',
      explanation: 'Fetches recent RAG evaluation benchmark scores.',
      confidence: 0.85
    };
  }

  if (/\b(sql|query|queries|audit|history|logs)\b/i.test(q)) {
    return {
      sql: 'SELECT id, project_id, natural_language_question, generated_sql, execution_time, row_count, created_at FROM sql_queries ORDER BY created_at DESC LIMIT 100;',
      explanation: 'Fetches recent SQL query execution history.',
      confidence: 0.85
    };
  }

  if (/\b(user|users|author|authors|member|members)\b/i.test(q)) {
    return {
      sql: 'SELECT id, name, email, created_at FROM users LIMIT 100;',
      explanation: 'Lists registered user accounts.',
      confidence: 0.85
    };
  }

  return null;
}

/**
 * Generates SQL from user question using Gemini + Schema context
 */
export async function generateSQL(question: string, schemaContext: string): Promise<{ sql: string; explanation: string; confidence: number }> {
  const ai = getGeminiClient();

  const prompt = `
${SYSTEM_INSTRUCTION}

DATABASE SCHEMA:
${schemaContext}

USER QUESTION:
${question}

Generate PostgreSQL SQL query for the user question based strictly on the provided database schema.
Return JSON response with "reasoning", "sql", "explanation", and "confidence".
`;

  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest'
  ];
  let response: any = null;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[SQL Copilot] Attempting model: ${modelName}.`);
      response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });
      console.log(`[SQL Copilot] Model ${modelName} success.`);

      if (response && response.text) {
        break;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!response || !response.text) {
    // Attempt local rule fallback for standard queries if Gemini quota/rate limits were encountered
    const localFallback = fallbackRuleBasedSQL(question);
    if (localFallback) {
      console.log('[SQL Copilot] Model calls exhausted. Using deterministic rule-based SQL generator fallback.');
      return localFallback;
    }

    const errStr = JSON.stringify(lastError || {});
    const lastErrMsg = lastError?.message || '';
    if (lastErrMsg.includes('429') || lastErrMsg.includes('RESOURCE_EXHAUSTED') || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
      throw new Error('Gemini API quota temporarily exceeded (429 Resource Exhausted). Please wait a moment and try again.');
    }

    throw lastError || new Error('All Gemini models failed to generate SQL response.');
  }

  const text = response.text || '';
  
  // Parse JSON output
  let parsed: any = null;
  let rawSql = '';
  let explanation = '';
  let confidence = 0.9;

  try {
    const cleanedText = text.replace(/```json/gi, '').replace(/```sql/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanedText);
  } catch (pErr) {
    console.warn('[SQL Copilot] Could not directly parse Gemini text as JSON:', text);
  }

  if (parsed && typeof parsed === 'object') {
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    rawSql = parsed.sql || parsed.query || parsed.sql_query || parsed.sqlQuery || parsed.code || parsed.statement || parsed.sqlStatement || '';
    explanation = parsed.explanation || '';
    const reasoning = parsed.reasoning || '';
    confidence = parsed.confidence || 0.9;
    
    // Return reasoning as part of the response if needed, 
    // but the existing interface only expects sql, explanation, confidence
    return { sql: rawSql, explanation, confidence };
  }

  // Fallback extraction if rawSql is missing
  if (!rawSql && typeof text === 'string') {
    const sqlBlockMatch = text.match(/```(?:sql)?\s*([\s\S]*?)\s*```/i);
    if (sqlBlockMatch && sqlBlockMatch[1]) {
      rawSql = sqlBlockMatch[1].trim();
    } else {
      const trimmed = text.trim();
      if (/^(SELECT|WITH)\b/i.test(trimmed)) {
        rawSql = trimmed;
      }
    }
  }

  // Clean rawSql of lingering markdown syntax
  if (typeof rawSql === 'string') {
    rawSql = rawSql.replace(/```sql/gi, '').replace(/```/g, '').trim();
  }

  if (!rawSql || typeof rawSql !== 'string') {
    console.error('[SQL Copilot] Gemini raw text was:', text);
    throw new Error('Gemini did not produce a valid SQL string.');
  }

  return {
    sql: rawSql,
    explanation: explanation || 'Generates query results based on the provided schema.',
    confidence: confidence || 0.9,
  };
}

/**
 * Executes full natural language to SQL execution pipeline with safety validation
 */
export async function processNaturalLanguageQuery(
  projectId: string,
  userId: string,
  question: string
): Promise<SqlQueryResponse> {
  // 0. Pre-validate natural language prompt intent against destructive operations BEFORE database execution
  const promptCheck = detectUnsafePrompt(question);
  if (promptCheck.isUnsafe) {
    throw {
      stage: 'validation',
      errorType: 'unsafe_sql',
      error: promptCheck.reason || 'Query rejected: This operation is not permitted. SQL Copilot only allows safe read-only PostgreSQL queries.',
    };
  }

  // 1. Discover Schema
  let schemaContext: string;
  try {
    schemaContext = await getCompactSchemaContext();
  } catch (err: any) {
    const errorMsg = 'Failed to inspect database schema.';
    throw { stage: 'generation', error: `${errorMsg} Details: ${err.message}` };
  }

  // 2. Generate SQL with Gemini
  let genResult: { sql: string; explanation: string; confidence: number };
  try {
    genResult = await generateSQL(question, schemaContext);
  } catch (err: any) {
    const errMsg = err.message || 'Failed to generate SQL from prompt.';
    if (errMsg.includes('Query rejected') || /delete|update|insert|drop|truncate|alter|read-only|unsafe/i.test(errMsg)) {
      throw {
        stage: 'validation',
        errorType: 'unsafe_sql',
        error: errMsg.startsWith('Query rejected')
          ? errMsg
          : 'Query rejected: This operation is not permitted. SQL Copilot only allows safe read-only PostgreSQL queries.',
      };
    }
    throw { stage: 'generation', error: errMsg };
  }

  // 3. Validate Generated SQL
  const validation = validateSql(genResult.sql);
  if (!validation.isValid) {
    throw {
      stage: 'validation',
      errorType: 'unsafe_sql',
      error: validation.reason || 'Query rejected: This operation is not permitted. SQL Copilot only allows safe read-only PostgreSQL queries.',
    };
  }

  // 4. Execute Read-Only SQL against database
  let execResult: SqlExecutionResult;
  try {
    execResult = await executeReadOnlySql(validation.normalizedSql);
  } catch (err: any) {
    throw { stage: 'execution', error: err.message || 'Database query execution error.' };
  }

  // 5. Save query record to history table (sql_queries)
  try {
    await db.insert(sqlQueries).values({
      projectId,
      userId,
      naturalLanguageQuestion: question,
      generatedSql: validation.normalizedSql,
      executionTime: execResult.executionTimeMs,
      rowCount: execResult.rowCount,
    });
  } catch (histErr) {
    console.error('[SQL Copilot] Failed to save query history record:', histErr);
  }

  return {
    question,
    sql: validation.normalizedSql,
    explanation: genResult.explanation,
    columns: execResult.columns,
    rows: execResult.rows,
    rowCount: execResult.rowCount,
    executionTimeMs: execResult.executionTimeMs,
  };
}

/**
 * Generates an explanation for a SQL query without running it
 */
export async function explainSql(sqlQuery: string): Promise<string> {
  const validation = validateSql(sqlQuery);
  if (!validation.isValid) {
    return `Cannot explain query: ${validation.reason}`;
  }

  const ai = getGeminiClient();
  const prompt = `
Explain this PostgreSQL SQL query in simple, developer-friendly language in 1-2 concise sentences.

SQL Query:
${validation.normalizedSql}
`;

  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.2,
        }
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn(`[SQL Copilot] explainSql model ${modelName} failed:`, err.message);
    }
  }

  return 'This query retrieves data from database tables based on specified filtering and ordering criteria.';
}
