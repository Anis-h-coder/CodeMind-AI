import { sql } from 'drizzle-orm';
import { db } from '../db/index.ts';

export interface SimilarChunkResult {
  content: string;
  filePath: string;
  sourceName: string;
  startLine: number;
  endLine: number;
  similarity: number;
}

/**
 * Performs a vector similarity search on document_chunks using pgvector.
 * Ensures security by scoping queries strictly to the target project.
 */
export async function searchSimilarChunks(
  projectId: string,
  queryEmbedding: number[],
  topK: number = 5
): Promise<SimilarChunkResult[]> {
  try {
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    // Perform vector distance query using cosine distance (<=>)
    // 1 - cosine distance equals cosine similarity
    const results = await db.execute(sql`
      SELECT 
        file_path as "filePath",
        source_name as "sourceName",
        content,
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM document_chunks
      WHERE project_id = ${projectId}::uuid
      ORDER BY embedding <=> ${vectorStr}::vector ASC
      LIMIT ${topK}
    `);

    const formattedResults: SimilarChunkResult[] = (results.rows as any[]).map((row) => {
      const content = row.content || '';
      
      // Parse start and end lines dynamically from our prepended header
      let startLine = 1;
      let endLine = 1;
      const linesMatch = content.match(/Lines (\d+)-(\d+)/);
      if (linesMatch) {
        startLine = parseInt(linesMatch[1], 10);
        endLine = parseInt(linesMatch[2], 10);
      }

      return {
        content,
        filePath: row.filePath || '',
        sourceName: row.sourceName || '',
        startLine,
        endLine,
        similarity: parseFloat(row.similarity || '0'),
      };
    });

    return formattedResults;
  } catch (error: any) {
    console.error("[Vector Search Service] Error during pgvector similarity search:", error);
    throw error;
  }
}
