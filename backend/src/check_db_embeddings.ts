import dotenv from 'dotenv';
dotenv.config();

import { db } from './db/index.ts';
import { documentChunks } from './db/schema.ts';
import { eq } from 'drizzle-orm';

function computeLocalFallback(txt: string) {
  const vector = new Array(768).fill(0);
  let hash = 0;
  for (let j = 0; j < txt.length; j++) {
    hash = (hash << 5) - hash + txt.charCodeAt(j);
    hash |= 0;
    const idx = Math.abs(hash) % 768;
    vector[idx] += 1;
  }
  let hash2 = 5381;
  for (let j = 0; j < txt.length; j++) {
    hash2 = ((hash2 << 5) + hash2) + txt.charCodeAt(j);
    hash2 |= 0;
    const idx = Math.abs(hash2) % 768;
    vector[idx] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(v => v / magnitude);
}

async function main() {
  const projectId = '13e36bb0-cbde-409a-b56d-253779fe9689'; // openai-knowledge-retrieval

  const chunks = await db.select({
    content: documentChunks.content,
    embedding: documentChunks.embedding
  })
  .from(documentChunks)
  .where(eq(documentChunks.projectId, projectId))
  .limit(5);

  console.log(`Checking ${chunks.length} chunks from DB:`);
  chunks.forEach((chunk, i) => {
    const dbEmb = chunk.embedding || [];
    const localFallback = computeLocalFallback(chunk.content);
    
    // Calculate dot product to see if they are identical
    let dot = 0;
    for (let j = 0; j < 768; j++) {
      dot += dbEmb[j] * localFallback[j];
    }
    
    console.log(`Chunk ${i}: dot product with local fallback = ${dot}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
