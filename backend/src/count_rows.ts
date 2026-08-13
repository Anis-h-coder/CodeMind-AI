import dotenv from 'dotenv';
dotenv.config();

import { db } from './db/index.ts';
import { documentChunks, files, repositories } from './db/schema.ts';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const projectId = '13e36bb0-cbde-409a-b56d-253779fe9689'; // openai-knowledge-retrieval

  // Repo
  const repos = await db.select().from(repositories).where(eq(repositories.projectId, projectId));
  console.log(`Repo ID: ${repos[0].id}`);

  // Files count
  const fileCount = await db.select({ count: sql<number>`count(*)` }).from(files).where(eq(files.repositoryId, repos[0].id));
  console.log(`Total files in files table: ${fileCount[0].count}`);

  // Document chunks count
  const chunkCount = await db.select({ count: sql<number>`count(*)` }).from(documentChunks).where(eq(documentChunks.projectId, projectId));
  console.log(`Total chunks in document_chunks table: ${chunkCount[0].count}`);

  // Distinct file paths in document_chunks
  const distinctFiles = await db.execute(sql`
    SELECT COUNT(DISTINCT file_path) as count FROM document_chunks WHERE project_id = ${projectId}::uuid
  `);
  console.log(`Distinct file paths in document_chunks: ${distinctFiles.rows[0].count}`);

  // Let's print all rows for 'retrieval/pipeline.py'
  const pipelineChunks = await db.select({
    id: documentChunks.id,
    filePath: documentChunks.filePath,
    chunkIndex: documentChunks.chunkIndex,
    createdAt: documentChunks.createdAt
  })
  .from(documentChunks)
  .where(sql`project_id = ${projectId}::uuid AND file_path = 'retrieval/pipeline.py'`)
  .orderBy(documentChunks.chunkIndex);

  console.log(`\nPipeline.py chunks in DB: ${pipelineChunks.length}`);
  pipelineChunks.forEach(c => {
    console.log(`- ID: ${c.id} | ChunkIndex: ${c.chunkIndex} | CreatedAt: ${c.createdAt}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
