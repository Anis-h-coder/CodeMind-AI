import dotenv from 'dotenv';
dotenv.config();

import { db } from './db/index.ts';
import { documentChunks, repositories } from './db/schema.ts';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const projectId = '13e36bb0-cbde-409a-b56d-253779fe9689';
  const repos = await db.select().from(repositories).where(eq(repositories.projectId, projectId));
  console.log(`Repository status: ${repos[0]?.indexingStatus}, Error: ${repos[0]?.indexingError}`);

  const chunkCount = await db.select({ count: sql<number>`count(*)` }).from(documentChunks).where(eq(documentChunks.projectId, projectId));
  console.log(`Chunks in DB: ${chunkCount[0].count}`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
