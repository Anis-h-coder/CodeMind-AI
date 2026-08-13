import dotenv from 'dotenv';
dotenv.config();

import { db } from './db/index.ts';
import { documentChunks } from './db/schema.ts';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const result = await db.execute(sql`
    SELECT id, project_id, file_path, chunk_index, created_at
    FROM document_chunks
    WHERE file_path = 'retrieval/pipeline.py'
  `);

  console.log(`Chunks for retrieval/pipeline.py in DB: ${result.rows.length}`);
  result.rows.forEach((row: any) => {
    console.log(`- ID: ${row.id} | Project ID: ${row.project_id} | Index: ${row.chunk_index} | CreatedAt: ${row.created_at}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
