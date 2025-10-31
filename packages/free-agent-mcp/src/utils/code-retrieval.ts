/**
 * Code-Aware Retrieval
 * 
 * Symbol graph retrieval with heuristics (not just embeddings).
 * When the task mentions a file/function/entity, retrieve:
 * 1. The target file
 * 2. 2-3 most similar files in the same folder
 * 3. Any tests that exercise similar behavior
 * 4. The type/interface that governs the change
 * 
 * Heuristics (prioritize in order):
 * 1. Same folder
 * 2. Same file prefix
 * 3. Same interface/type names
 * 4. Embedding similarity (future)
 */

import * as fs from 'fs';
import * as path from 'path';
import { buildSymbolIndex, type SymbolIndex, type Symbol } from './symbol-indexer.js';

export interface RetrievalResult {
  targetFile: string;
  similarFiles: string[];
  relatedTests: string[];
  relatedTypes: string[];
  snippets: Array<{
    file: string;
    content: string;
    reason: string;
  }>;
}

/**
 * Retrieve code-aware context for a task
 */
export async function retrieveCodeContext(
  root: string,
  query: {
    targetFile?: string;
    targetFunction?: string;
    targetClass?: string;
    targetInterface?: string;
    keywords?: string[];
  }
): Promise<RetrievalResult> {
  // Build symbol index
  const index = await buildSymbolIndex(root, {
    exts: ['.ts', '.tsx', '.js', '.jsx'],
    maxFiles: 2000,
    maxPerFileIds: 200,
    exclude: ['node_modules', 'dist', 'build', '.next', 'coverage', '__generated__'],
  });

  const result: RetrievalResult = {
    targetFile: query.targetFile || '',
    similarFiles: [],
    relatedTests: [],
    relatedTypes: [],
    snippets: [],
  };

  // Find target symbols
  const targetSymbols = findTargetSymbols(index, query);

  if (targetSymbols.length === 0 && !query.targetFile) {
    return result;
  }

  // Get target file
  if (query.targetFile && fs.existsSync(path.join(root, query.targetFile))) {
    result.targetFile = query.targetFile;
  } else if (targetSymbols.length > 0) {
    result.targetFile = path.relative(root, targetSymbols[0].file);
  }

  // Find similar files using heuristics
  if (result.targetFile) {
    result.similarFiles = findSimilarFiles(root, result.targetFile, index, 3);
  }

  // Find related tests
  result.relatedTests = findRelatedTests(root, result.targetFile, targetSymbols, index);

  // Find related types/interfaces
  result.relatedTypes = findRelatedTypes(targetSymbols, index);

  // Build snippets
  result.snippets = buildSnippets(root, result);

  return result;
}

/**
 * Find target symbols based on query
 */
function findTargetSymbols(index: SymbolIndex, query: any): Symbol[] {
  const symbols: Symbol[] = [];

  if (query.targetFunction) {
    const found = index.byName.get(query.targetFunction);
    if (found) symbols.push(...found.filter(s => s.type === 'function'));
  }

  if (query.targetClass) {
    const found = index.byName.get(query.targetClass);
    if (found) symbols.push(...found.filter(s => s.type === 'class'));
  }

  if (query.targetInterface) {
    const found = index.byName.get(query.targetInterface);
    if (found) symbols.push(...found.filter(s => s.type === 'interface'));
  }

  return symbols;
}

/**
 * Find similar files using heuristics
 */
function findSimilarFiles(
  root: string,
  targetFile: string,
  index: SymbolIndex,
  limit: number
): string[] {
  const targetDir = path.dirname(targetFile);
  const targetBasename = path.basename(targetFile, path.extname(targetFile));
  
  const scores = new Map<string, number>();

  for (const file of index.byFile.keys()) {
    const relPath = path.relative(root, file);
    if (relPath === targetFile) continue;

    let score = 0;

    // Heuristic 1: Same folder (highest priority)
    const fileDir = path.dirname(relPath);
    if (fileDir === targetDir) {
      score += 100;
    } else if (fileDir.startsWith(targetDir)) {
      score += 50;
    }

    // Heuristic 2: Same file prefix
    const fileBasename = path.basename(relPath, path.extname(relPath));
    if (fileBasename.startsWith(targetBasename)) {
      score += 30;
    } else if (targetBasename.startsWith(fileBasename)) {
      score += 20;
    }

    // Heuristic 3: Shared symbols (same interface/type names)
    const targetSymbols = index.byFile.get(path.join(root, targetFile)) || [];
    const fileSymbols = index.byFile.get(file) || [];
    
    const targetNames = new Set(targetSymbols.map(s => s.name));
    const sharedSymbols = fileSymbols.filter(s => targetNames.has(s.name));
    score += sharedSymbols.length * 10;

    if (score > 0) {
      scores.set(relPath, score);
    }
  }

  // Sort by score and return top N
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([file]) => file);
}

/**
 * Find related tests
 */
function findRelatedTests(
  root: string,
  targetFile: string,
  targetSymbols: Symbol[],
  index: SymbolIndex
): string[] {
  const tests: string[] = [];
  const targetBasename = path.basename(targetFile, path.extname(targetFile));
  const targetDir = path.dirname(targetFile);

  // Pattern 1: Same name with .test/.spec suffix
  const testPatterns = [
    `${targetBasename}.test.ts`,
    `${targetBasename}.test.tsx`,
    `${targetBasename}.spec.ts`,
    `${targetBasename}.spec.tsx`,
  ];

  for (const pattern of testPatterns) {
    const testPath = path.join(targetDir, pattern);
    if (fs.existsSync(path.join(root, testPath))) {
      tests.push(testPath);
    }
  }

  // Pattern 2: Tests in __tests__ folder
  const testsDir = path.join(targetDir, '__tests__');
  if (fs.existsSync(path.join(root, testsDir))) {
    for (const pattern of testPatterns) {
      const testPath = path.join(testsDir, pattern);
      if (fs.existsSync(path.join(root, testPath))) {
        tests.push(testPath);
      }
    }
  }

  // Pattern 3: Tests that import target symbols
  if (targetSymbols.length > 0) {
    const targetNames = new Set(targetSymbols.map(s => s.name));
    
    for (const [file, symbols] of index.byFile.entries()) {
      const relPath = path.relative(root, file);
      if (!relPath.includes('.test.') && !relPath.includes('.spec.')) continue;
      if (tests.includes(relPath)) continue;

      // Check if test file mentions target symbols
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const hasTargetSymbol = Array.from(targetNames).some(name => 
          content.includes(name)
        );
        
        if (hasTargetSymbol) {
          tests.push(relPath);
        }
      } catch (error) {
        // Skip files we can't read
      }
    }
  }

  return tests.slice(0, 5); // Limit to 5 tests
}

/**
 * Find related types/interfaces
 */
function findRelatedTypes(targetSymbols: Symbol[], index: SymbolIndex): string[] {
  const types: string[] = [];
  const typeNames = new Set<string>();

  // Get types/interfaces from target symbols
  for (const symbol of targetSymbols) {
    if (symbol.type === 'interface' || symbol.type === 'type') {
      if (!typeNames.has(symbol.name)) {
        typeNames.add(symbol.name);
        types.push(`${symbol.type} ${symbol.name} (${symbol.file}:${symbol.line})`);
      }
    }
  }

  // Find types/interfaces used by target symbols
  for (const symbol of targetSymbols) {
    try {
      const content = fs.readFileSync(symbol.file, 'utf-8');
      const lines = content.split('\n');
      const symbolLine = lines[symbol.line - 1];

      // Extract type annotations (simple regex)
      const typeMatches = symbolLine.matchAll(/:\s*([A-Z][a-zA-Z0-9]*)/g);
      for (const match of typeMatches) {
        const typeName = match[1];
        if (!typeNames.has(typeName)) {
          const typeSymbols = index.byName.get(typeName);
          if (typeSymbols) {
            const typeSymbol = typeSymbols.find(s => s.type === 'interface' || s.type === 'type');
            if (typeSymbol) {
              typeNames.add(typeName);
              types.push(`${typeSymbol.type} ${typeName} (${typeSymbol.file}:${typeSymbol.line})`);
            }
          }
        }
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  return types.slice(0, 10); // Limit to 10 types
}

/**
 * Build code snippets from retrieval results
 */
function buildSnippets(root: string, result: RetrievalResult): Array<{
  file: string;
  content: string;
  reason: string;
}> {
  const snippets: Array<{ file: string; content: string; reason: string }> = [];

  // Add target file
  if (result.targetFile) {
    const content = readFileSnippet(root, result.targetFile);
    if (content) {
      snippets.push({
        file: result.targetFile,
        content,
        reason: 'Target file',
      });
    }
  }

  // Add similar files
  for (const file of result.similarFiles) {
    const content = readFileSnippet(root, file);
    if (content) {
      snippets.push({
        file,
        content,
        reason: 'Similar file (same folder/prefix/symbols)',
      });
    }
  }

  // Add related tests
  for (const file of result.relatedTests.slice(0, 2)) {
    const content = readFileSnippet(root, file);
    if (content) {
      snippets.push({
        file,
        content,
        reason: 'Related test',
      });
    }
  }

  return snippets;
}

/**
 * Read file snippet (first 100 lines or full file if smaller)
 */
function readFileSnippet(root: string, file: string): string | null {
  try {
    const fullPath = path.join(root, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    
    if (lines.length <= 100) {
      return content;
    }
    
    return lines.slice(0, 100).join('\n') + '\n\n// ... (truncated)';
  } catch (error) {
    return null;
  }
}

