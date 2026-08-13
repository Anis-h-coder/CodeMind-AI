import dotenv from 'dotenv';
dotenv.config();

import { db } from './db/index.ts';
import { documentChunks } from './db/schema.ts';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const projectId = '13e36bb0-cbde-409a-b56d-253779fe9689';
  
  const countBefore = await db.select({ count: sql<number>`count(*)` }).from(documentChunks).where(eq(documentChunks.projectId, projectId));
  console.log(`Chunks before delete: ${countBefore[0].count}`);

  const deleteResult = await db.delete(documentChunks).where(eq(documentChunks.projectId, projectId));
  console.log(`Delete completed.`);

  const countAfter = await db.select({ count: sql<number>`count(*)` }).from(documentChunks).where(eq(documentChunks.projectId, projectId));
  console.log(`Chunks after delete: ${countAfter[0].count}`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
