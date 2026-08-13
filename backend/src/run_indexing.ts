import dotenv from 'dotenv';
dotenv.config();

import { indexProjectEmbeddings } from './services/embeddingService.ts';

async function main() {
  const projectId = '13e36bb0-cbde-409a-b56d-253779fe9689';
  const repositoryId = '5c473524-ca4b-4587-9ad9-78370aa21a6b';

  console.log(`Starting indexing for repository: ${repositoryId}...`);
  await indexProjectEmbeddings(projectId, repositoryId);
  console.log(`Indexing completed successfully!`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
