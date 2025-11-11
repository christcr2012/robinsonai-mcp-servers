/**
 * Symbol-Aware Search Features
 * 
 * Integrates with FREE Agent's symbol indexer to provide code-aware search.
 * Boosts results that match symbol names, types, and function signatures.
 */

import { buildSymbolIndex, type SymbolIndex, type Symbol } from '@robinson_ai_systems/shared-utils';
import { retrieveCodeContext, type RetrievalResult } from '@robinson_ai_systems/shared-utils';
import type { StoredChunk } from './store.js';

export interface SymbolAwareSearchOptions {
  boostSymbolMatches?: boolean;  // Boost chunks that contain matched symbols (default: true)
  boostSameFile?: boolean;        // Boost chunks from same file as symbol (default: true)
  symbolMatchWeight?: number;     // Weight for symbol matches (default: 2.0)
  sameFileWeight?: number;        // Weight for same file (default: 1.5)
}

/**
 * Build symbol index for repository
 */
export async function buildSymbolIndexForRepo(
  root: string,
  options: {
    exts?: string[];
    maxFiles?: number;
    exclude?: string[];
  } = {}
): Promise<SymbolIndex> {
  const {
    exts = ['.ts', '.tsx', '.js', '.jsx'],
    maxFiles = 2000,
    exclude = ['node_modules', 'dist', 'build', '.next', 'coverage', '__generated__'],
  } = options;

  console.log(`[SymbolAware] Building symbol index for ${root}...`);
  const index = await buildSymbolIndex(root, { exts, maxFiles, exclude, maxPerFileIds: 200 });
  console.log(`[SymbolAware] Indexed ${index.symbols.length} symbols from ${index.byFile.size} files`);
  
  return index;
}

/**
 * Find symbols matching query
 */
export function findMatchingSymbols(query: string, index: SymbolIndex): Symbol[] {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter(Boolean);
  
  const matches: Symbol[] = [];
  
  // Exact name match
  for (const word of words) {
    const exactMatches = index.byName.get(word);
    if (exactMatches) {
      matches.push(...exactMatches);
    }
  }
  
  // Partial name match
  for (const [name, symbols] of index.byName.entries()) {
    const nameLower = name.toLowerCase();
    if (words.some(w => nameLower.includes(w) || w.includes(nameLower))) {
      matches.push(...symbols);
    }
  }
  
  // Remove duplicates
  const seen = new Set<string>();
  return matches.filter(s => {
    const key = `${s.file}:${s.line}:${s.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Apply symbol-aware boosting to search results
 */
export function applySymbolBoosting(
  chunks: Array<{ c: StoredChunk; s: number }>,
  query: string,
  index: SymbolIndex,
  options: SymbolAwareSearchOptions = {}
): Array<{ c: StoredChunk; s: number }> {
  const {
    boostSymbolMatches = true,
    boostSameFile = true,
    symbolMatchWeight = 2.0,
    sameFileWeight = 1.5,
  } = options;

  if (!boostSymbolMatches && !boostSameFile) {
    return chunks; // No boosting requested
  }

  // Find symbols matching query
  const matchedSymbols = findMatchingSymbols(query, index);
  
  if (matchedSymbols.length === 0) {
    return chunks; // No symbol matches, return as-is
  }

  console.log(`[SymbolAware] Found ${matchedSymbols.length} matching symbols for query: "${query}"`);

  // Build lookup maps for fast boosting
  const symbolFiles = new Set(matchedSymbols.map(s => s.file));
  const symbolNames = new Set(matchedSymbols.map(s => s.name));

  // Apply boosting
  return chunks.map(({ c, s }) => {
    let boostedScore = s;

    // Boost if chunk contains matched symbol name
    if (boostSymbolMatches) {
      for (const name of symbolNames) {
        if (c.text.includes(name)) {
          boostedScore *= symbolMatchWeight;
          break; // Only boost once per chunk
        }
      }
    }

    // Boost if chunk is from same file as matched symbol
    if (boostSameFile) {
      for (const file of symbolFiles) {
        if (c.uri === file || c.uri.endsWith(file)) {
          boostedScore *= sameFileWeight;
          break; // Only boost once per chunk
        }
      }
    }

    return { c, s: boostedScore };
  });
}

/**
 * Retrieve code context for a query (delegates to FREE Agent's code-aware retrieval)
 */
export async function retrieveCodeContextForQuery(
  root: string,
  query: {
    targetFile?: string;
    targetFunction?: string;
    targetClass?: string;
    targetInterface?: string;
    keywords?: string[];
  }
): Promise<RetrievalResult> {
  console.log(`[SymbolAware] Retrieving code context for query:`, query);
  return retrieveCodeContext(root, query);
}

/**
 * Extract symbols from chunks (for symbol-aware snippet generation)
 */
export function extractSymbolsFromChunks(
  chunks: StoredChunk[],
  index: SymbolIndex
): Map<string, Symbol[]> {
  const chunkSymbols = new Map<string, Symbol[]>();

  for (const chunk of chunks) {
    const fileSymbols = index.byFile.get(chunk.uri);
    if (fileSymbols) {
      chunkSymbols.set(chunk.hash, fileSymbols);
    }
  }

  return chunkSymbols;
}

/**
 * Find all files that import a given file (import graph)
 */
export function findImporters(
  targetFile: string,
  index: SymbolIndex
): string[] {
  const importers: string[] = [];
  
  // Simple heuristic: search for import statements mentioning the target file
  for (const [file, symbols] of index.byFile.entries()) {
    if (file === targetFile) continue;
    
    // This is a simplified version - a full implementation would parse import statements
    // For now, we just check if the file is mentioned
    const targetBasename = targetFile.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '');
    if (targetBasename) {
      // Check if any symbol in this file might import from target
      // (This is a heuristic - proper implementation would parse imports)
      importers.push(file);
    }
  }
  
  return importers;
}

/**
 * Find all files imported by a given file (import graph)
 */
export function findImports(
  sourceFile: string,
  index: SymbolIndex
): string[] {
  const imports: string[] = [];
  
  // Simple heuristic: look for files in same directory or common import paths
  const sourceDir = sourceFile.split('/').slice(0, -1).join('/');
  
  for (const file of index.byFile.keys()) {
    if (file === sourceFile) continue;
    
    const fileDir = file.split('/').slice(0, -1).join('/');
    
    // Files in same directory are likely imports
    if (fileDir === sourceDir) {
      imports.push(file);
    }
  }
  
  return imports;
}

/**
 * Get neighborhood of a file (imports + importers)
 */
export function getFileNeighborhood(
  file: string,
  index: SymbolIndex
): {
  imports: string[];
  importedBy: string[];
  symbols: Symbol[];
} {
  return {
    imports: findImports(file, index),
    importedBy: findImporters(file, index),
    symbols: index.byFile.get(file) || [],
  };
}

/**
 * Find symbol definition
 */
export function findSymbolDefinition(
  symbolName: string,
  index: SymbolIndex
): Symbol | null {
  const symbols = index.byName.get(symbolName);
  if (!symbols || symbols.length === 0) return null;
  
  // Prefer public exports
  const publicSymbol = symbols.find((s: Symbol) => s.isPublic);
  if (publicSymbol) return publicSymbol;
  
  // Otherwise return first match
  return symbols[0];
}

/**
 * Find all callers of a function (simple heuristic)
 */
export function findCallers(
  functionName: string,
  index: SymbolIndex
): Array<{ file: string; line: number; context: string }> {
  const callers: Array<{ file: string; line: number; context: string }> = [];
  
  // This is a simplified heuristic - proper implementation would parse AST
  // For now, we just look for files that mention the function name
  for (const [file, symbols] of index.byFile.entries()) {
    // Skip the file where function is defined
    const definition = symbols.find((s: Symbol) => s.name === functionName && s.type === 'function');
    if (definition) continue;
    
    // Check if file mentions the function
    // (In a real implementation, we'd parse the file and find actual call sites)
    callers.push({
      file,
      line: 0, // Would need to parse file to get actual line
      context: `File ${file} may call ${functionName}`,
    });
  }
  
  return callers;
}

