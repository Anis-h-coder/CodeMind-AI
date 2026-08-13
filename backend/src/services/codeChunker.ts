import * as path from 'path';

export interface CodeChunk {
  filePath: string;
  fileName: string;
  language: string;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  content: string;
}

/**
 * Splits source code content into overlapping line-based chunks.
 * Handles logical line windows (defaulting to 80 lines of code with a 20-line overlap).
 */
export function chunkFile(
  filePath: string,
  content: string,
  language: string,
  chunkSize: number = 80,
  overlap: number = 20
): CodeChunk[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const fileName = path.basename(filePath);
  const lines = content.split(/\r?\n/);
  const totalLines = lines.length;
  const chunks: CodeChunk[] = [];
  
  let chunkIndex = 0;
  let startIdx = 0;

  // If the file is extremely short, make it a single chunk
  if (totalLines <= chunkSize) {
    const chunkContent = formatChunkWithHeader(filePath, lines.join('\n'), 1, totalLines);
    return [{
      filePath,
      fileName,
      language,
      chunkIndex: 0,
      startLine: 1,
      endLine: totalLines,
      content: chunkContent,
    }];
  }

  while (startIdx < totalLines) {
    const endIdx = Math.min(startIdx + chunkSize, totalLines);
    const chunkLines = lines.slice(startIdx, endIdx);
    
    const startLine = startIdx + 1;
    const endLine = endIdx;

    const rawContent = chunkLines.join('\n');
    const chunkContent = formatChunkWithHeader(filePath, rawContent, startLine, endLine);

    chunks.push({
      filePath,
      fileName,
      language,
      chunkIndex,
      startLine,
      endLine,
      content: chunkContent,
    });

    chunkIndex++;
    
    // Advance starting index by (chunkSize - overlap)
    // If endIdx reaches totalLines, we are done
    if (endIdx === totalLines) {
      break;
    }
    
    startIdx += (chunkSize - overlap);
    
    // Guard against infinite loop
    if (chunkSize <= overlap) {
      startIdx += chunkSize;
    }
  }

  return chunks;
}

/**
 * Helper to prepend file path and line context to the chunk content.
 * This ensures the embedding and LLM generation models always have absolute context on where this code resides.
 */
function formatChunkWithHeader(filePath: string, content: string, startLine: number, endLine: number): string {
  return `// File: ${filePath} (Lines ${startLine}-${endLine})\n${content}`;
}
