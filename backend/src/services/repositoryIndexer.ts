import { db } from '../db/index';
import { repositories, files } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as githubService from './githubService';
import { shouldIndexFile, getLanguageFromFilePath } from '../utils/fileFilter';
import path from 'path';
import { indexProjectEmbeddings } from './embeddingService';

/**
 * Checks if content is likely a binary file.
 */
function isBinaryContent(content: string): boolean {
  if (!content) return false;
  // Check for null characters
  if (content.includes('\0')) {
    return true;
  }
  
  // Check first 1024 characters for control characters (except tab, newline, carriage return)
  const sample = content.slice(0, 1024);
  let controlChars = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      controlChars++;
    }
  }
  
  // If control characters make up more than 10% of the sample, it is likely binary
  if (sample.length > 0 && (controlChars / sample.length) > 0.1) {
    return true;
  }
  
  return false;
}

/**
 * Indexes a repository asynchronously.
 * Updates the repository record with progress and results.
 */
export async function startIndexing(repositoryId: string): Promise<void> {
  // Start the indexing process as a non-blocking background promise
  indexRepositoryBackground(repositoryId).catch((err) => {
    console.error(`[Indexer Error] Fatal failure for repo ${repositoryId}:`, err);
  });
}

/**
 * Background worker task.
 */
async function indexRepositoryBackground(repositoryId: string): Promise<void> {
  console.log(`[Indexer] Starting codebase indexing for repo ${repositoryId}...`);
  
  // 1. Fetch the repository record
  const repoRecords = await db.select().from(repositories).where(eq(repositories.id, repositoryId));
  if (repoRecords.length === 0) {
    console.error(`[Indexer] Repository ${repositoryId} not found in database.`);
    return;
  }

  const repo = repoRecords[0];

  const cleanOwner = (repo.owner || '').trim().split('?')[0].split('#')[0].replace(/\/+$/, '');
  let cleanRepo = (repo.repositoryName || '').trim().split('?')[0].split('#')[0].replace(/\/+$/, '');
  if (cleanRepo.endsWith('.git')) cleanRepo = cleanRepo.slice(0, -4);

  const stats = {
    repository: `${cleanOwner}/${cleanRepo}`,
    branch: repo.defaultBranch || 'main',
    stage: 'initializing',
    discoveredFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    failedFiles: 0,
    skippedReasons: [] as Array<{ file: string; reason: string }>,
    failedFilesList: [] as Array<{ file: string; error: string }>
  };

  try {
    // Detect repository's actual default branch dynamically
    console.log(`[Indexer] Fetching metadata to detect default branch for ${cleanOwner}/${cleanRepo}...`);
    let currentBranch = repo.defaultBranch || 'main';
    try {
      const gitMetadata = await githubService.getRepository(cleanOwner, cleanRepo);
      if (gitMetadata.defaultBranch) {
        currentBranch = gitMetadata.defaultBranch;
        console.log(`[Indexer] Detected default branch: "${currentBranch}" (previously "${repo.defaultBranch}")`);
        await db.update(repositories)
          .set({ defaultBranch: currentBranch })
          .where(eq(repositories.id, repositoryId));
      }
    } catch (metadataErr: any) {
      console.warn(`[Indexer] Failed to dynamically resolve default branch, falling back to database default branch: ${currentBranch}`);
    }

    stats.branch = currentBranch;
    stats.stage = 'indexing';

    // Update status to 'indexing'
    await db.update(repositories)
      .set({
        indexingStatus: 'indexing',
        indexingError: null,
        currentFile: 'Fetching repository file tree...',
        updatedAt: new Date()
      })
      .where(eq(repositories.id, repositoryId));

    // 2. Fetch the recursive file tree from GitHub
    console.log(`[Indexer] Fetching tree for ${cleanOwner}/${cleanRepo} (${currentBranch})...`);
    const treeItems = await githubService.getRepositoryTree(cleanOwner, cleanRepo, currentBranch);
    
    // 3. Filter tree items to identify indexable files vs skipped/invalid files
    // Ignore: directories, submodules (mode === '160000' or type === 'commit'), and unsupported types
    const validBlobs = treeItems.filter(item => {
      const isBlob = item.type === 'blob';
      const isSubmodule = item.mode === '160000' || (item.type as string) === 'commit';
      return isBlob && !isSubmodule;
    });

    stats.discoveredFiles = validBlobs.length;

    const filesToSync: typeof validBlobs = [];
    let skippedCount = 0;

    for (const file of validBlobs) {
      const fileSize = file.size || 0;
      if (shouldIndexFile(file.path, fileSize)) {
        filesToSync.push(file);
      } else {
        skippedCount++;
        let reason = 'Skipped by file filter rules (ignored folder, unsupported extension, or size > 500KB)';
        if (fileSize > 500 * 1024) {
          reason = `File size too large (${(fileSize / 1024).toFixed(1)} KB)`;
        }
        stats.skippedReasons.push({ file: file.path, reason });
      }
    }

    stats.skippedFiles = skippedCount;

    // Update initial status with file counts
    await db.update(repositories)
      .set({
        totalFiles: filesToSync.length,
        processedFiles: 0,
        skippedFiles: skippedCount,
        failedFiles: 0,
        indexingDiagnostics: JSON.stringify(stats),
        updatedAt: new Date()
      })
      .where(eq(repositories.id, repositoryId));

    console.log(`[Indexer] Found ${validBlobs.length} total files. Indexing ${filesToSync.length} supported files (Skipped ${skippedCount}).`);

    // 4. Fetch currently indexed files for this repo from PostgreSQL to perform delta deletion detection
    const dbFiles = await db.select({
      id: files.id,
      path: files.path
    }).from(files).where(eq(files.repositoryId, repositoryId));

    const dbFilesMap = new Map<string, string>(); // path -> id
    dbFiles.forEach(f => dbFilesMap.set(f.path, f.id));

    const activePaths = new Set<string>();
    let processedCount = 0;
    let failedCount = 0;

    // 5. Download and write file contents in controlled batches for performance and stability
    const BATCH_SIZE = 5;
    for (let i = 0; i < filesToSync.length; i += BATCH_SIZE) {
      const chunk = filesToSync.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        chunk.map(async (file) => {
          activePaths.add(file.path);
          try {
            // Update current file being indexed
            await db.update(repositories)
              .set({ currentFile: file.path })
              .where(eq(repositories.id, repositoryId));

            // Fetch real file content (decodes Base64 automatically)
            const rawContent = await githubService.getFileContent(
              cleanOwner, 
              cleanRepo, 
              file.path, 
              file.sha,
              currentBranch
            );

            // Sanitize content: remove null bytes (\0 / 0x00) which are forbidden in PostgreSQL text columns
            const content = (rawContent || '').replace(/\0/g, '');

            // Binary content check
            if (isBinaryContent(content)) {
              console.log(`[Indexer] Skipping binary file "${file.path}"`);
              skippedCount++;
              stats.skippedFiles = skippedCount;
              stats.skippedReasons.push({ file: file.path, reason: 'Detected binary content during decoding' });
              return;
            }

            const fileName = path.basename(file.path);
            const extension = path.extname(file.path).toLowerCase();
            const language = getLanguageFromFilePath(file.path);
            const size = file.size || Buffer.byteLength(content, 'utf8');

            // Check if file exists in DB
            const existingId = dbFilesMap.get(file.path);

            if (existingId) {
              // Update
              await db.update(files)
                .set({
                  name: fileName,
                  extension,
                  language,
                  size,
                  content
                })
                .where(eq(files.id, existingId));
            } else {
              // Insert
              await db.insert(files)
                .values({
                  repositoryId,
                  path: file.path,
                  name: fileName,
                  extension,
                  language,
                  size,
                  content
                });
            }

            processedCount++;
            stats.processedFiles = processedCount;
          } catch (fileErr: any) {
            console.error(`[Indexer] Failed to download or save file "${file.path}":`, fileErr?.message || fileErr);
            failedCount++;
            stats.failedFiles = failedCount;
            stats.failedFilesList.push({ file: file.path, error: fileErr?.message || 'Download/decoding error' });
          }
        })
      );

      // Update progress in database
      await db.update(repositories)
        .set({
          processedFiles: processedCount,
          failedFiles: failedCount,
          skippedFiles: skippedCount,
          indexingDiagnostics: JSON.stringify(stats),
          updatedAt: new Date()
        })
        .where(eq(repositories.id, repositoryId));
    }

    // 6. Delete files from DB that are no longer present in GitHub (delta cleanup)
    const deletedPaths: string[] = [];
    dbFiles.forEach(f => {
      if (!activePaths.has(f.path)) {
        deletedPaths.push(f.path);
      }
    });

    if (deletedPaths.length > 0) {
      console.log(`[Indexer] Cleaning up ${deletedPaths.length} deleted files from database...`);
      for (const deletedPath of deletedPaths) {
        const existingId = dbFilesMap.get(deletedPath);
        if (existingId) {
          await db.delete(files).where(eq(files.id, existingId));
        }
      }
    }

    // Update status to complete for file download, handover to embeddings
    console.log(`[Indexer] File indexing complete for ${cleanOwner}/${cleanRepo}. Starting embedding pipeline...`);
    
    stats.stage = 'chunking';
    await db.update(repositories)
      .set({
        processedFiles: processedCount,
        failedFiles: failedCount,
        skippedFiles: skippedCount,
        indexingDiagnostics: JSON.stringify(stats),
        updatedAt: new Date()
      })
      .where(eq(repositories.id, repositoryId));

    // Run embedding pipeline (awaited here to ensure completeness of the RAG pipeline)
    await indexProjectEmbeddings(repo.projectId, repositoryId);

  } catch (err: any) {
    console.error(`[Indexer] Fatal error occurred during repository indexing:`, err);
    
    stats.stage = 'failed';
    const finalErrMessage = err.message || 'Unknown indexing error occurred';
    
    await db.update(repositories)
      .set({
        indexingStatus: 'failed',
        indexingError: finalErrMessage,
        currentFile: null,
        indexingDiagnostics: JSON.stringify(stats),
        updatedAt: new Date()
      })
      .where(eq(repositories.id, repositoryId));
  }
}
