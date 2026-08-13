import dotenv from 'dotenv';
dotenv.config();

import { db } from './db/index.ts';
import { files, repositories } from './db/schema.ts';
import { eq } from 'drizzle-orm';
import { BASELINE_QUESTIONS } from './services/evaluationService.ts';

async function main() {
  const projectId = '13e36bb0-cbde-409a-b56d-253779fe9689'; // openai-knowledge-retrieval

  const repos = await db.select().from(repositories).where(eq(repositories.projectId, projectId));
  const repo = repos[0];

  const repoFiles = await db.select({
    path: files.path
  }).from(files).where(eq(files.repositoryId, repo.id));

  const allFilePaths = repoFiles.map(f => f.path);

  console.log(`Total files in repository: ${allFilePaths.length}`);

  for (const qDef of BASELINE_QUESTIONS) {
    const expectedSources = allFilePaths.filter(filePath => {
      const pathLower = filePath.toLowerCase();
      return qDef.expectedPatterns.some(pat => pathLower.includes(pat.toLowerCase()));
    });

    console.log(`\nQuestion ID: ${qDef.id}`);
    console.log(`Question: "${qDef.question}"`);
    console.log(`Expected patterns: ${JSON.stringify(qDef.expectedPatterns)}`);
    console.log(`Expected sources count: ${expectedSources.length}`);
    console.log(`Expected sources list:`);
    expectedSources.forEach(src => console.log(`  - ${src}`));
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
