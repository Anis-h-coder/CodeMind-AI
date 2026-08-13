import dotenv from 'dotenv';
dotenv.config();

import { db } from './db/index.ts';
import { files, documentChunks, repositories } from './db/schema.ts';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const projectId = '13e36bb0-cbde-409a-b56d-253779fe9689';
  
  // 1. Check repositories
  const repoList = await db.select().from(repositories).where(eq(repositories.projectId, projectId));
  console.log(`Repositories connected to project: ${repoList.length}`);
  for (const r of repoList) {
    console.log(`- Repo ID: ${r.id}, Name: ${r.owner}/${r.repositoryName}`);
  }

  // 2. Check duplicate files in files table
  const filePaths = await db.execute(sql`
    SELECT path, COUNT(*) as count 
    FROM files 
    WHERE repository_id IN (SELECT id FROM repositories WHERE project_id = ${projectId}::uuid)
    GROUP BY path
    HAVING COUNT(*) > 1
  `);
  console.log(`\nDuplicate files by path in files table: ${filePaths.rows.length}`);
  filePaths.rows.forEach((row: any) => {
    console.log(`- Path: ${row.path} | Count: ${row.count}`);
  });

  // 3. Check duplicate chunks in document_chunks
  const chunkPaths = await db.execute(sql`
    SELECT file_path, chunk_index, COUNT(*) as count
    FROM document_chunks
    WHERE project_id = ${projectId}::uuid
    GROUP BY file_path, chunk_index
    HAVING COUNT(*) > 1
  `);
  console.log(`\nDuplicate chunks by file_path and chunk_index: ${chunkPaths.rows.length}`);
  if (chunkPaths.rows.length > 0) {
    console.log(`First 10 duplicates:`);
    chunkPaths.rows.slice(0, 10).forEach((row: any) => {
      console.log(`- File: ${row.file_path} | Chunk Index: ${row.chunk_index} | Count: ${row.count}`);
    });
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
