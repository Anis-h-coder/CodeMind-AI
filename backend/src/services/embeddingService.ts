import { db } from '../db/index';
import { files, documentChunks, repositories } from '../db/schema';
import { eq } from 'drizzle-orm';
import { chunkFile } from './codeChunker';
import { generateEmbeddingsBatch } from './geminiService';
import { shouldIndexFile } from '../utils/fileFilter';

/**
 * Generates and stores embeddings for all files belonging to a project.
 * Implements granular state tracking: 'chunking' -> 'embedding' -> 'vector_indexing' -> 'completed'.
 */
export async function indexProjectEmbeddings(projectId: string, repositoryId: string): Promise<void> {
  console.log(`[Embedding Service] Starting embedding pipeline for project ${projectId}...`);

  // Fetch current repository diagnostics stats if available
  let stats: any = { stage: 'chunking' };
  try {
    const repoRecords = await db.select().from(repositories).where(eq(repositories.id, repositoryId));
    if (repoRecords.length > 0 && repoRecords[0].indexingDiagnostics) {
      stats = JSON.parse(repoRecords[0].indexingDiagnostics);
    }
  } catch (err) {
    console.warn('[Embedding Service] Failed to parse initial diagnostics:', err);
  }

  try {
    stats.stage = 'chunking';

    // 1. Update status to 'chunking'
    await db.update(repositories)
      .set({
        indexingStatus: 'chunking',
        indexingDiagnostics: JSON.stringify(stats),
        currentFile: 'Slicing files into logical code chunks...',
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));

    // 2. Retrieve all files for this repository from the database
    const dbFiles = await db.select().from(files).where(eq(files.repositoryId, repositoryId));
    const filesToEmbed = dbFiles.filter(file => shouldIndexFile(file.path, file.size));
    console.log(`[Embedding Service] Retrieved ${dbFiles.length} files from DB. Filtered to ${filesToEmbed.length} files to embed.`);

    if (filesToEmbed.length === 0) {
      console.log(`[Embedding Service] No files found to embed.`);
      stats.stage = 'completed';
      await db.update(repositories)
        .set({
          indexingStatus: 'completed',
          indexingDiagnostics: JSON.stringify(stats),
          currentFile: null,
          lastIndexedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(repositories.id, repositoryId));
      return;
    }

    // 3. Clear existing chunks to allow clean re-indexing without duplicates
    await db.delete(documentChunks).where(eq(documentChunks.projectId, projectId));
    console.log(`[Embedding Service] Cleared existing document chunks for project ${projectId}.`);

    // 4. Chunk all files
    const allChunks: Array<{
      filePath: string;
      fileName: string;
      language: string;
      chunkIndex: number;
      content: string;
    }> = [];

    for (const file of filesToEmbed) {
      const chunks = chunkFile(file.path, file.content, file.language, 80, 20);
      allChunks.push(...chunks);
    }

    console.log(`[Embedding Service] Created ${allChunks.length} logical code chunks.`);

    // 5. Update status to 'embedding'
    stats.stage = 'embedding';
    await db.update(repositories)
      .set({
        indexingStatus: 'embedding',
        indexingDiagnostics: JSON.stringify(stats),
        currentFile: `Generating vector embeddings for ${allChunks.length} chunks...`,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));

    // 6. Generate embeddings using bulk batching to respect rate and token limits safely
    console.log(`[Embedding Service] Requesting batch embeddings for all ${allChunks.length} chunks...`);
    const chunkTexts = allChunks.map(c => c.content);
    const vectors = await generateEmbeddingsBatch(chunkTexts);

    const chunksWithEmbeddings = allChunks.map((chunk, idx) => ({
      projectId,
      sourceType: 'github_file',
      sourceName: chunk.fileName,
      filePath: chunk.filePath,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embedding: vectors[idx],
    }));

    // 7. Update status to 'vector_indexing'
    stats.stage = 'vector_indexing';
    await db.update(repositories)
      .set({
        indexingStatus: 'vector_indexing',
        indexingDiagnostics: JSON.stringify(stats),
        currentFile: `Storing ${chunksWithEmbeddings.length} embeddings in PostgreSQL...`,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));

    // 8. Insert embeddings into PostgreSQL using Drizzle
    // Write in transaction or split into database chunks if too large (e.g. 50 chunks at a time)
    const writeBatchSize = 50;
    for (let i = 0; i < chunksWithEmbeddings.length; i += writeBatchSize) {
      const batchToWrite = chunksWithEmbeddings.slice(i, i + writeBatchSize);
      await db.insert(documentChunks).values(batchToWrite);
    }

    console.log(`[Embedding Service] Saved ${chunksWithEmbeddings.length} code chunk embeddings to PostgreSQL.`);

    // 9. Complete pipeline
    stats.stage = 'completed';
    await db.update(repositories)
      .set({
        indexingStatus: 'completed',
        indexingDiagnostics: JSON.stringify(stats),
        currentFile: null,
        lastIndexedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));

  } catch (error: any) {
    console.error(`[Embedding Service] Fatal failure during embedding pipeline:`, error);
    
    // Set status to failed
    stats.stage = 'failed';
    const finalErrMessage = `Embedding pipeline failed: ${error.message || 'Unknown error'}`;
    
    await db.update(repositories)
      .set({
        indexingStatus: 'failed',
        indexingError: finalErrMessage,
        indexingDiagnostics: JSON.stringify(stats),
        currentFile: null,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));
  }
}
