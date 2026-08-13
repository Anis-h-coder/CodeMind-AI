import path from 'path';

// List of supported text-based/code-based file extensions
const SUPPORTED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.java',
  '.c',
  '.cpp',
  '.go',
  '.rs',
  '.php',
  '.sql',
  '.md',
  '.mdx',
  '.json',
  '.yaml',
  '.yml',
  '.css',
  '.scss',
  '.html',
  '.xml',
  '.txt'
]);

// Special exact file matches
const SUPPORTED_EXACT_FILES = new Set([
  '.env.example'
]);

// Folders/paths to strictly ignore during codebase traversal
const IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  'vendor',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  'pnpm-lock.yaml',
  'data',
  'example_data'
];

// Maximum allowed size for indexing (500 KB to avoid huge bundles or binary bloat)
const MAX_FILE_SIZE_BYTES = 500 * 1024;

export function shouldIndexFile(filePath: string, size: number = 0): boolean {
  // Check if any ignored directory segment is in the path
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathSegments = normalizedPath.split('/');

  const containsIgnoredDir = pathSegments.some(segment => 
    IGNORED_DIRECTORIES.includes(segment.toLowerCase())
  );

  if (containsIgnoredDir) {
    return false;
  }

  // Size limit check
  if (size > MAX_FILE_SIZE_BYTES) {
    return false;
  }

  const fileName = path.basename(filePath);
  if (SUPPORTED_EXACT_FILES.has(fileName)) {
    return true;
  }

  const extension = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(extension);
}

export function getLanguageFromFilePath(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  const mapping: { [key: string]: string } = {
    '.ts': 'TypeScript',
    '.tsx': 'TSX',
    '.js': 'JavaScript',
    '.jsx': 'JSX',
    '.py': 'Python',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.go': 'Go',
    '.rs': 'Rust',
    '.php': 'PHP',
    '.sql': 'SQL',
    '.md': 'Markdown',
    '.mdx': 'MarkdownX',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.html': 'HTML',
    '.xml': 'XML',
    '.txt': 'Text'
  };

  const fileName = path.basename(filePath);
  if (fileName === '.env.example') {
    return 'Env';
  }

  return mapping[extension] || 'Text';
}
