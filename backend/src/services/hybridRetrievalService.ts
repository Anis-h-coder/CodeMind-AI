import { sql } from 'drizzle-orm';
import { db } from '../db/index';
import { SimilarChunkResult } from './vectorSearchService';

export interface HybridRetrievalOptions {
  projectId: string;
  query: string;
  queryEmbedding: number[];
  topK?: number; // Final top K chunks to return (e.g. 12-20)
  candidatePoolSize?: number; // Expanded candidate pool size (e.g. 80-100)
}

export interface DebugRetrievalInfo {
  query: string;
  vectorCandidatesCount: number;
  keywordCandidatesCount: number;
  targetedCandidatesCount: number;
  finalCandidatesCount: number;
  scoredCandidates: Array<{
    filePath: string;
    vectorScore: number;
    keywordScore: number;
    pathScore: number;
    projectMatchScore: number;
    codeFileScore: number;
    finalScore: number;
  }>;
}

/**
 * Extracts candidate project names, file names, directory segments, and key terms from a natural language query.
 */
function extractQueryEntities(query: string): {
  projectDirectoryPatterns: string[];
  fileTerms: string[];
  keywords: string[];
  isApiQuery: boolean;
  isWeatherQuery: boolean;
  isAwsS3Query: boolean;
  isDiscordOpenAiQuery: boolean;
  isImplementationQuery: boolean;
} {
  const queryLower = query.toLowerCase();

  // 1. Identify specific project directory patterns from query
  const projectDirectoryPatterns: string[] = [];

  // Match hyphenated or underscored project names (e.g., Expense-Tracker, Weather-Report, AWS-S3, CRUD-with-postgresql)
  const hyphenMatches = query.match(/[a-zA-Z0-9]+[-_][a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*/g) || [];
  hyphenMatches.forEach(match => {
    const cleanMatch = match.toLowerCase();
    projectDirectoryPatterns.push(`%/${cleanMatch}/%`, `%${cleanMatch}%`);
  });

  // Known multi-word or single-word project folders in repositories
  const knownProjectFolderNames = [
    'expense-tracker', 'expense_tracker', 'weather-report', 'weather_report', 'hangman', 'aws-s3', 'aws_s3',
    'currency-converter', 'calculator', 'tic-tac-toe', 'quiz-app', 'chat-application', 'todo-list',
    'expense', 'weather', 'calculator'
  ];

  knownProjectFolderNames.forEach(folder => {
    if (queryLower.includes(folder.replace(/[-_]/g, ' ')) || queryLower.includes(folder)) {
      projectDirectoryPatterns.push(`%/${folder}/%`, `%${folder}%`);
    }
  });

  // 2. Identify file name extensions or specific files mentioned (e.g., app.py, main.py, server.ts, stats.py)
  const fileTerms: string[] = [];
  const fileMatches = query.match(/[a-zA-Z0-9_]+\.(py|ts|tsx|js|jsx|json|md|yaml|yml|sql|sh|html|css)/gi) || [];
  fileMatches.forEach(fm => fileTerms.push(fm.toLowerCase()));

  if (queryLower.includes('app.py')) fileTerms.push('app.py');
  if (queryLower.includes('main.py')) fileTerms.push('main.py');
  if (queryLower.includes('stats')) fileTerms.push('expense_income_stats', 'stats');

  // 3. Extract raw keywords excluding stop words
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'where', 'which', 'files',
    'are', 'is', 'how', 'does', 'explain', 'implementation', 'implemented', 'responsible',
    'query', 'expansion', 'reranking', 'reranker', 'what', 'identify', 'main', 'source',
    'work', 'working', 'application', 'project', 'projects', 'code', 'show', 'list', 'about',
    'call', 'calls', 'make', 'makes', 'use', 'uses', 'using'
  ]);

  const rawTokens = queryLower.replace(/[^\w\s\.-]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const keywords = Array.from(new Set(rawTokens.filter(t => !stopWords.has(t))));

  // Check intent flags
  const isApiQuery = /\b(api|apis|external|http|https|request|requests|fetch|urllib|endpoint|endpoints|rest|sdk|third-party|third party|integration|integrations|integrated|outbound|client|clients|service|services)\b/i.test(queryLower) ||
    /openweathermap|open weather|aws|s3|boto3|discord|openai|requests\.get|requests\.post|axios/i.test(queryLower);

  const isWeatherQuery = /openweathermap|weather/i.test(queryLower);
  const isAwsS3Query = /aws|s3|boto3/i.test(queryLower);
  const isDiscordOpenAiQuery = /discord|openai/i.test(queryLower);
  const isImplementationQuery = /where|which|how|impl|architect|communicat|endpoint|route|pipeline|ingestion|retrieval|expansion|rerank|responsib|call|calls|make|makes|using|use|uses|show|list/i.test(queryLower);

  return {
    projectDirectoryPatterns,
    fileTerms,
    keywords,
    isApiQuery,
    isWeatherQuery,
    isAwsS3Query,
    isDiscordOpenAiQuery,
    isImplementationQuery,
  };
}

/**
 * Scoring Formula Documentation:
 * Final Hybrid Score = 
 *   (Vector Similarity * 0.25) 
 * + (Keyword Match Score * 0.15) 
 * + (Project Match Boost * 0.35) 
 * + (File Name / Path Match Boost * 0.15)
 * + (Code File Relevance * 0.10)
 * 
 * Penalties:
 * - data/example_data/ chunks receive a heavy penalty (-0.6) for implementation queries.
 * - Non-code files (css, svg, png, docker) receive a moderate penalty for code questions.
 */
export async function performHybridRetrieval(
  options: HybridRetrievalOptions
): Promise<{ chunks: SimilarChunkResult[]; debugInfo: DebugRetrievalInfo }> {
  const { projectId, query, queryEmbedding, topK = 16, candidatePoolSize = 80 } = options;
  const queryLower = query.toLowerCase();

  const {
    projectDirectoryPatterns,
    fileTerms,
    keywords,
    isApiQuery,
    isWeatherQuery,
    isAwsS3Query,
    isDiscordOpenAiQuery,
    isImplementationQuery
  } = extractQueryEntities(query);

  const vectorStr = `[${queryEmbedding.join(',')}]`;

  // 1. Vector Retrieval Channel (Expanded candidate set: candidatePoolSize)
  let vectorRows: any[] = [];
  try {
    const vectorRes = await db.execute(sql`
      SELECT 
        id,
        file_path as "filePath",
        source_name as "sourceName",
        content,
        chunk_index as "chunkIndex",
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM document_chunks
      WHERE project_id = ${projectId}::uuid
      ORDER BY embedding <=> ${vectorStr}::vector ASC
      LIMIT ${candidatePoolSize}
    `);
    vectorRows = vectorRes.rows as any[];
  } catch (err) {
    console.error('[Hybrid Retrieval] Vector search failed:', err);
  }

  // 2. Lexical & Keyword Search Channel across document_chunks
  let keywordRows: any[] = [];
  try {
    const allSearchKeywords = Array.from(new Set([...keywords, ...fileTerms]));
    if (allSearchKeywords.length > 0) {
      // Construct ILIKE conditions for keyword search across file_path and content
      const keywordConditions = allSearchKeywords.map(kw => sql`file_path ILIKE ${`%${kw}%`} OR content ILIKE ${`%${kw}%`}`);
      const combinedCondition = sql.join(keywordConditions, sql` OR `);

      const keywordRes = await db.execute(sql`
        SELECT 
          id,
          file_path as "filePath",
          source_name as "sourceName",
          content,
          chunk_index as "chunkIndex",
          0.5 as similarity
        FROM document_chunks
        WHERE project_id = ${projectId}::uuid AND (${combinedCondition})
        LIMIT ${candidatePoolSize}
      `);
      keywordRows = keywordRes.rows as any[];
    }
  } catch (err) {
    console.error('[Hybrid Retrieval] Keyword search failed:', err);
  }

  // 3. Targeted Entity & Path/Project Directory Search Channel
  let targetedRows: any[] = [];
  try {
    const targetedConditions: any[] = [];

    // Project Directory Patterns
    projectDirectoryPatterns.forEach(p => {
      targetedConditions.push(sql`file_path ILIKE ${p}`);
    });

    // File terms
    fileTerms.forEach(ft => {
      targetedConditions.push(sql`file_path ILIKE ${`%${ft}%`}`);
    });

    // Architecture & domain patterns
    if (queryLower.includes('retrieval') || queryLower.includes('pipeline') || queryLower.includes('expansion') || queryLower.includes('rerank')) {
      targetedConditions.push(sql`file_path ILIKE '%retrieval%' OR file_path ILIKE '%pipeline%' OR content ILIKE '%rerank%' OR content ILIKE '%expansion%'`);
    }
    if (queryLower.includes('backend') || queryLower.includes('frontend') || queryLower.includes('communicat')) {
      targetedConditions.push(sql`file_path ILIKE '%backend%' OR file_path ILIKE '%frontend%' OR file_path ILIKE '%server%' OR file_path ILIKE '%api%'`);
    }
    if (queryLower.includes('ingestion') || queryLower.includes('load') || queryLower.includes('store')) {
      targetedConditions.push(sql`file_path ILIKE '%ingestion%' OR file_path ILIKE '%store%' OR file_path ILIKE '%load%'`);
    }

    if (isApiQuery) {
      const apiPatterns = [
        '%requests.get%', '%requests.post%', '%requests.%', '%urllib%', '%boto3%', '%s3%',
        '%openweathermap%', '%api.openweathermap.org%', '%openai%', '%discord%', '%fetch(%', '%axios%',
        '%http://%', '%https://%', '%api_key%'
      ];
      if (isWeatherQuery) apiPatterns.push('%weather%');
      if (isAwsS3Query) apiPatterns.push('%boto3%', '%s3%');
      if (isDiscordOpenAiQuery) apiPatterns.push('%openai%', '%discord%');

      apiPatterns.forEach(p => {
        targetedConditions.push(sql`file_path ILIKE ${p} OR content ILIKE ${p}`);
      });
    }

    if (targetedConditions.length > 0) {
      const combinedPathCondition = sql.join(targetedConditions, sql` OR `);

      const targetedRes = await db.execute(sql`
        SELECT 
          id,
          file_path as "filePath",
          source_name as "sourceName",
          content,
          chunk_index as "chunkIndex",
          0.85 as similarity
        FROM document_chunks
        WHERE project_id = ${projectId}::uuid AND (${combinedPathCondition})
        LIMIT 80
      `);
      targetedRows = targetedRes.rows as any[];
    }
  } catch (err) {
    console.error('[Hybrid Retrieval] Targeted path search failed:', err);
  }

  // Combine and deduplicate candidates map by filePath:chunkIndex
  const candidateMap = new Map<string, any>();

  vectorRows.forEach(row => {
    const key = `${row.filePath}:${row.chunkIndex}`;
    candidateMap.set(key, {
      ...row,
      vectorSimilarity: parseFloat(row.similarity || '0'),
      keywordHitCount: 0,
      isTargetedHit: false,
    });
  });

  keywordRows.forEach(row => {
    const key = `${row.filePath}:${row.chunkIndex}`;
    if (candidateMap.has(key)) {
      const existing = candidateMap.get(key);
      existing.keywordHitCount += 1;
    } else {
      candidateMap.set(key, {
        ...row,
        vectorSimilarity: 0.35,
        keywordHitCount: 1,
        isTargetedHit: false,
      });
    }
  });

  targetedRows.forEach(row => {
    const key = `${row.filePath}:${row.chunkIndex}`;
    if (candidateMap.has(key)) {
      const existing = candidateMap.get(key);
      existing.vectorSimilarity = Math.max(existing.vectorSimilarity, 0.85);
      existing.isTargetedHit = true;
    } else {
      candidateMap.set(key, {
        ...row,
        vectorSimilarity: 0.85, // high targeted priority
        keywordHitCount: 2,
        isTargetedHit: true,
      });
    }
  });

  const allCandidates = Array.from(candidateMap.values());
  const scoredCandidates: any[] = [];

  // Multi-Factor Reranking Loop
  for (const candidate of allCandidates) {
    const filePath = (candidate.filePath || '').toLowerCase();
    const content = (candidate.content || '').toLowerCase();

    // Active outbound API call implementation check
    const hasActiveApiCall =
      /requests\.(get|post|put|delete|patch|head|request|session)/i.test(content) ||
      /urllib\.(request|parse)|http\.client|httpx|aiohttp/i.test(content) ||
      /boto3\.(client|resource)|s3_client|s3\.upload|s3\.download/i.test(content) ||
      /api\.openweathermap\.org|openweathermap/i.test(content) ||
      /openai\.(chatcompletion|completion|embeddings)|openai\(/i.test(content) ||
      /discord\.(client|bot)|commands\.bot/i.test(content) ||
      /fetch\(|axios\.(get|post|put|delete)/i.test(content) ||
      /https?:\/\/api\./i.test(content);

    // Config / settings / migration file check
    const isSettingsOrConfig =
      /settings\.py|profiles_settings|\.xml$|drizzle\.config|vite\.config|\.yaml$|\.yml$|\.json$/i.test(filePath) ||
      filePath.includes('/migrations/') || filePath.includes('/migrate/') || filePath.includes('admin.py');

    // A. Code-Aware Filtering & Penalties
    let codeFileScore = 0.5;
    const isCodeFile = /\.(py|ts|tsx|js|jsx|java|go|rs|sql)$/i.test(filePath);
    const isConfigOrDoc = /\.(json|yaml|yml|md|env)$/i.test(filePath);
    const isExampleData = filePath.includes('data/example_data');
    const isUiAssetOrStyle = /\.(css|svg|png|jpg|ico|woff)$/i.test(filePath) || filePath.includes('docker');

    if (isCodeFile) codeFileScore = 1.0;
    else if (isConfigOrDoc) codeFileScore = 0.6;
    else if (isUiAssetOrStyle) codeFileScore = 0.2;

    if (isImplementationQuery && isExampleData) {
      codeFileScore = -0.6; // heavy penalty for example data on implementation queries
    }

    // B. Project Match Score
    let projectMatchScore = 0.0;
    for (const pattern of projectDirectoryPatterns) {
      const cleanPattern = pattern.replace(/[%/]/g, '').toLowerCase();
      if (cleanPattern && filePath.includes(cleanPattern)) {
        if (filePath.includes(`/${cleanPattern}/`) || filePath.includes(`-${cleanPattern}`) || filePath.includes(`${cleanPattern}-`)) {
          projectMatchScore = Math.max(projectMatchScore, 1.0);
        } else {
          projectMatchScore = Math.max(projectMatchScore, 0.8);
        }
      }
    }

    // C. File Name Match Score
    let fileNameMatchScore = 0.0;
    for (const fTerm of fileTerms) {
      if (filePath.includes(fTerm)) {
        fileNameMatchScore = Math.max(fileNameMatchScore, 1.0);
      }
    }

    // D. Path Keywords & Domain Relevance
    let pathScore = 0.5;
    const matchedKeywordsInPath = keywords.filter(kw => filePath.includes(kw));
    if (matchedKeywordsInPath.length > 0) {
      pathScore += matchedKeywordsInPath.length * 0.25;
    }

    // Specific domain path boosts
    if (queryLower.includes('retrieval') && filePath.includes('retrieval')) pathScore += 0.4;
    if (queryLower.includes('frontend') && filePath.includes('frontend')) pathScore += 0.4;
    if (queryLower.includes('backend') && filePath.includes('backend')) pathScore += 0.4;
    if ((queryLower.includes('fastapi') || queryLower.includes('backend')) && (filePath.includes('app/backend') || filePath.includes('app/'))) pathScore += 0.5;
    if (queryLower.includes('ingestion') && filePath.includes('ingestion')) pathScore += 0.4;
    if (queryLower.includes('store') && filePath.includes('store')) pathScore += 0.4;
    if (queryLower.includes('expansion') && (filePath.includes('expansion') || content.includes('expansion'))) pathScore += 0.4;
    if (queryLower.includes('rerank') && (filePath.includes('rerank') || content.includes('rerank'))) pathScore += 0.4;

    // E. API & Service Specific Boosts
    let apiBoost = 0.0;
    if (isApiQuery && hasActiveApiCall) {
      apiBoost += 0.40;
    }
    if (isWeatherQuery && (filePath.includes('weather') || content.includes('openweathermap'))) {
      apiBoost += 0.35;
    }
    if (isAwsS3Query && (filePath.includes('s3') || content.includes('boto3') || content.includes('s3'))) {
      apiBoost += 0.35;
    }
    if (isDiscordOpenAiQuery && (content.includes('openai') || content.includes('discord') || filePath.includes('openai') || filePath.includes('discord'))) {
      apiBoost += 0.35;
    }

    // F. Config & Settings Deprioritization
    let configPenalty = 0.0;
    if ((isApiQuery || isImplementationQuery) && isSettingsOrConfig && !hasActiveApiCall) {
      configPenalty = -0.60;
    }

    // E. Content Keyword Relevance Score
    let keywordScore = 0.0;
    const matchingKeywordsInContent = keywords.filter(kw => content.includes(kw));
    keywordScore = Math.min(1.0, (matchingKeywordsInContent.length / Math.max(1, keywords.length)) + (candidate.keywordHitCount * 0.15));

    // Vector Similarity
    const vectorScore = candidate.vectorSimilarity || 0.0;

    // Combined Hybrid Scoring Formula:
    let finalScore = (vectorScore * 0.25) + 
                     (keywordScore * 0.15) + 
                     (projectMatchScore * 0.35) + 
                     (fileNameMatchScore * 0.15) + 
                     (pathScore * 0.10) + 
                     (codeFileScore * 0.10) +
                     apiBoost +
                     configPenalty;

    if (isImplementationQuery && isExampleData) {
      finalScore -= 0.6; // ensure example data drops to bottom
    }

    scoredCandidates.push({
      ...candidate,
      vectorScore,
      keywordScore,
      pathScore,
      projectMatchScore,
      fileNameMatchScore,
      codeFileScore,
      finalScore,
    });
  }

  // Sort candidates by finalScore descending
  scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);

  // Apply a file diversity filter to maximize unique file paths in retrieval results and boost recall
  const topCandidates: any[] = [];
  const fileCounts = new Map<string, number>();

  // Pass 1: Select up to 2 chunks per unique file path to ensure deep coverage of key source files
  for (const candidate of scoredCandidates) {
    const filePath = candidate.filePath;
    const currentCount = fileCounts.get(filePath) || 0;
    if (currentCount < 2) {
      topCandidates.push(candidate);
      fileCounts.set(filePath, currentCount + 1);
    }
    if (topCandidates.length >= topK) {
      break;
    }
  }

  // Pass 2: Fill remaining slots if topK not yet reached
  if (topCandidates.length < topK) {
    for (const candidate of scoredCandidates) {
      const alreadyAdded = topCandidates.some(c => c.filePath === candidate.filePath && c.chunkIndex === candidate.chunkIndex);
      if (!alreadyAdded) {
        topCandidates.push(candidate);
        if (topCandidates.length >= topK) {
          break;
        }
      }
    }
  }

  // Format into SimilarChunkResult
  const finalChunks: SimilarChunkResult[] = topCandidates.map(c => {
    let startLine = 1;
    let endLine = 1;
    const linesMatch = (c.content || '').match(/Lines (\d+)-(\d+)/);
    if (linesMatch) {
      startLine = parseInt(linesMatch[1], 10);
      endLine = parseInt(linesMatch[2], 10);
    } else if (c.chunkIndex !== undefined) {
      startLine = c.chunkIndex * 50 + 1;
      endLine = (c.chunkIndex + 1) * 50;
    }

    return {
      content: c.content,
      filePath: c.filePath,
      sourceName: c.sourceName,
      startLine,
      endLine,
      similarity: Math.max(0.1, Math.min(1.0, c.finalScore)),
    };
  });

  // Debug Information Logging
  const debugInfo: DebugRetrievalInfo = {
    query,
    vectorCandidatesCount: vectorRows.length,
    keywordCandidatesCount: keywordRows.length,
    targetedCandidatesCount: targetedRows.length,
    finalCandidatesCount: finalChunks.length,
    scoredCandidates: scoredCandidates.slice(0, 15).map(c => ({
      filePath: c.filePath,
      vectorScore: parseFloat(c.vectorScore.toFixed(3)),
      keywordScore: parseFloat(c.keywordScore.toFixed(3)),
      pathScore: parseFloat(c.pathScore.toFixed(3)),
      projectMatchScore: parseFloat((c.projectMatchScore || 0).toFixed(3)),
      codeFileScore: parseFloat(c.codeFileScore.toFixed(3)),
      finalScore: parseFloat(c.finalScore.toFixed(3)),
    }))
  };

  console.log('[Hybrid Retrieval Pipeline Debug]', JSON.stringify(debugInfo, null, 2));

  return { chunks: finalChunks, debugInfo };
}

