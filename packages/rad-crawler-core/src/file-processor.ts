/**
 * File Processing Logic for RAD Crawler
 * Handles file discovery, parsing, classification, and chunking
 */

import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';
import { extname, basename, relative } from 'path';
import fg from 'fast-glob';
import { simpleGit } from 'simple-git';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdirSync, existsSync } from 'fs';
import type {
  RadSource,
  RunCrawlOptions,
  DiscoveredFile,
  ParsedDocument,
  DocumentChunk,
} from './types.js';

const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.cache/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.map',
];

const DOC_TYPE_MAP: Record<string, string> = {
  '.ts': 'code',
  '.tsx': 'code',
  '.js': 'code',
  '.jsx': 'code',
  '.py': 'code',
  '.go': 'code',
  '.rs': 'code',
  '.java': 'code',
  '.c': 'code',
  '.cpp': 'code',
  '.h': 'code',
  '.hpp': 'code',
  '.cs': 'code',
  '.rb': 'code',
  '.php': 'code',
  '.swift': 'code',
  '.kt': 'code',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.json': 'config',
  '.yaml': 'config',
  '.yml': 'config',
  '.toml': 'config',
  '.xml': 'config',
  '.sql': 'code',
  '.sh': 'code',
  '.bash': 'code',
  '.zsh': 'code',
  '.test.ts': 'test',
  '.test.js': 'test',
  '.spec.ts': 'test',
  '.spec.js': 'test',
};

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.sql': 'sql',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'zsh',
};

export async function discoverFiles(
  source: RadSource,
  options: RunCrawlOptions
): Promise<DiscoveredFile[]> {
  let basePath: string;

  // Handle different source types
  if (source.sourceType === 'git_repo') {
    basePath = await cloneOrUpdateRepo(source);
  } else if (source.sourceType === 'filesystem') {
    basePath = source.config.path as string;
    if (!basePath) {
      throw new Error('Filesystem source requires config.path');
    }
  } else {
    throw new Error(`Unsupported source type: ${source.sourceType}`);
  }

  // Build glob patterns
  const includePatterns = options.overrides?.includePatterns || source.config.includePatterns || ['**/*'];
  const excludePatterns = [
    ...DEFAULT_EXCLUDE_PATTERNS,
    ...(options.overrides?.excludePatterns || source.config.excludePatterns || []),
  ];

  // Discover files
  const files = await fg(includePatterns, {
    cwd: basePath,
    ignore: excludePatterns,
    onlyFiles: true,
    followSymbolicLinks: options.overrides?.followSymlinks ?? source.config.followSymlinks ?? false,
    deep: options.overrides?.maxDepth ?? source.config.maxDepth ?? 20,
  });

  return files.map(file => {
    const fullPath = join(basePath, file);
    const stats = statSync(fullPath);
    return {
      path: fullPath,
      relativePath: file,
      sizeBytes: stats.size,
      extension: extname(file),
    };
  });
}

async function cloneOrUpdateRepo(source: RadSource): Promise<string> {
  const repoUrl = source.config.repoUrl as string;
  if (!repoUrl) {
    throw new Error('Git repo source requires config.repoUrl');
  }

  const tempDir = join(tmpdir(), 'rad-crawler', source.id);

  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  const git = simpleGit();

  if (existsSync(join(tempDir, '.git'))) {
    // Update existing repo
    await git.cwd(tempDir).pull();
  } else {
    // Clone new repo
    await git.clone(repoUrl, tempDir);
  }

  return tempDir;
}




export function parseDocument(file: DiscoveredFile, source: RadSource): ParsedDocument {
  const content = readFileSync(file.path, 'utf-8');
  const ext = file.extension.toLowerCase();

  // Determine doc type
  let docType = DOC_TYPE_MAP[ext] || 'other';

  // Override for test files
  if (file.relativePath.includes('.test.') || file.relativePath.includes('.spec.')) {
    docType = 'test';
  }

  // Determine language
  const language = LANGUAGE_MAP[ext];

  // Compute content hash
  const contentHash = createHash('sha256').update(content).digest('hex');

  return {
    externalId: file.relativePath,
    docType,
    language,
    content,
    contentHash,
    sizeBytes: file.sizeBytes,
    metadata: {
      extension: ext,
      basename: basename(file.path),
    },
  };
}

export function chunkDocument(
  doc: ParsedDocument,
  chunkSize: number = 100,
  chunkOverlap: number = 10
): DocumentChunk[] {
  const lines = doc.content.split('\n');
  const chunks: DocumentChunk[] = [];

  let chunkIndex = 0;
  let startLine = 0;

  while (startLine < lines.length) {
    const endLine = Math.min(startLine + chunkSize, lines.length);
    const chunkLines = lines.slice(startLine, endLine);
    const content = chunkLines.join('\n');

    chunks.push({
      chunkIndex,
      content,
      startLine: startLine + 1, // 1-based line numbers
      endLine,
      tokenCount: estimateTokenCount(content),
      metadata: {
        linesCount: chunkLines.length,
      },
    });

    chunkIndex++;
    startLine = endLine - chunkOverlap;

    // Prevent infinite loop
    if (startLine >= endLine) {
      break;
    }
  }

  return chunks;
}

function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}
