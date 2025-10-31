/*
  code-graph.ts – CodeGraph Retrieval 2.0 (symbol + semantic)
  ------------------------------------------------------------
  Build lightweight code graph (files ⇄ symbols ⇄ imports) and retrieve by:
  - Changed surface (files being modified)
  - Neighbors (files that import/export changed symbols)
  - Call sites (files that reference changed symbols)
  
  Integrates with existing lightweightSymbolIndexer from repo-portable-tools.ts
*/

import * as fs from 'fs';
import * as path from 'path';
import { lightweightSymbolIndexer } from '../utils/repo-portable-tools.js';
import type { SymbolIndex } from '../utils/repo-portable-tools.js';

export type SymbolDef = {
  file: string;
  line: number;
  kind: 'function' | 'class' | 'const' | 'type' | 'interface';
};

export type SymbolRef = {
  file: string;
  line: number;
};

export type CodeGraph = {
  // Symbol → definitions
  defs: Map<string, SymbolDef[]>;
  
  // Symbol → references
  refs: Map<string, SymbolRef[]>;
  
  // File → imports (what this file imports)
  imports: Map<string, string[]>;
  
  // File → exports (what this file exports)
  exports: Map<string, string[]>;
  
  // File → symbols defined in this file
  fileSymbols: Map<string, string[]>;
};

/**
 * Build code graph from symbol index
 */
export async function buildCodeGraph(root: string): Promise<CodeGraph> {
  const index = await lightweightSymbolIndexer(root);
  
  const graph: CodeGraph = {
    defs: new Map(),
    refs: new Map(),
    imports: new Map(),
    exports: new Map(),
    fileSymbols: new Map(),
  };
  
  // Process each file in the index
  for (const [file, symbols] of Object.entries(index.files)) {
    const filePath = path.relative(root, file);
    
    // Track symbols defined in this file
    const fileSyms: string[] = [];
    
    for (const sym of symbols) {
      fileSyms.push(sym);
      
      // Add definition
      if (!graph.defs.has(sym)) {
        graph.defs.set(sym, []);
      }
      graph.defs.get(sym)!.push({
        file: filePath,
        line: 0, // TODO: extract line number from index
        kind: inferSymbolKind(sym),
      });
    }
    
    graph.fileSymbols.set(filePath, fileSyms);
    
    // Extract imports/exports from file content
    const content = fs.readFileSync(file, 'utf-8');
    const { imports, exports } = extractImportsExports(content, filePath);
    
    if (imports.length > 0) {
      graph.imports.set(filePath, imports);
    }
    
    if (exports.length > 0) {
      graph.exports.set(filePath, exports);
    }
    
    // Extract references (symbols used but not defined)
    const usedSymbols = extractUsedSymbols(content);
    for (const sym of usedSymbols) {
      if (!fileSyms.includes(sym)) {
        // This is a reference, not a definition
        if (!graph.refs.has(sym)) {
          graph.refs.set(sym, []);
        }
        graph.refs.get(sym)!.push({
          file: filePath,
          line: 0, // TODO: extract line number
        });
      }
    }
  }
  
  return graph;
}

/**
 * Retrieve context for changed files
 * Returns: changed files + neighbors + call sites
 */
export function retrieveContext(
  graph: CodeGraph,
  changedFiles: string[],
  opts: { maxNeighbors?: number; maxCallSites?: number } = {}
): {
  changed: string[];
  neighbors: string[];
  callSites: string[];
  symbols: string[];
} {
  const maxNeighbors = opts.maxNeighbors || 5;
  const maxCallSites = opts.maxCallSites || 10;
  
  const changed = new Set(changedFiles);
  const neighbors = new Set<string>();
  const callSites = new Set<string>();
  const symbols = new Set<string>();
  
  // 1. Collect symbols from changed files
  for (const file of changedFiles) {
    const fileSyms = graph.fileSymbols.get(file) || [];
    for (const sym of fileSyms) {
      symbols.add(sym);
    }
  }
  
  // 2. Find neighbors (files that import changed files)
  for (const [file, imports] of graph.imports.entries()) {
    if (changed.has(file)) continue;
    
    for (const imp of imports) {
      if (changedFiles.some(cf => imp.includes(cf) || cf.includes(imp))) {
        neighbors.add(file);
        if (neighbors.size >= maxNeighbors) break;
      }
    }
    
    if (neighbors.size >= maxNeighbors) break;
  }
  
  // 3. Find call sites (files that reference changed symbols)
  for (const sym of symbols) {
    const refs = graph.refs.get(sym) || [];
    for (const ref of refs) {
      if (!changed.has(ref.file) && !neighbors.has(ref.file)) {
        callSites.add(ref.file);
        if (callSites.size >= maxCallSites) break;
      }
    }
    
    if (callSites.size >= maxCallSites) break;
  }
  
  return {
    changed: Array.from(changed),
    neighbors: Array.from(neighbors),
    callSites: Array.from(callSites),
    symbols: Array.from(symbols),
  };
}

/**
 * Find files that define or reference a symbol
 */
export function findSymbol(graph: CodeGraph, symbolName: string): {
  definitions: SymbolDef[];
  references: SymbolRef[];
} {
  return {
    definitions: graph.defs.get(symbolName) || [],
    references: graph.refs.get(symbolName) || [],
  };
}

/**
 * Infer symbol kind from name
 */
function inferSymbolKind(name: string): SymbolDef['kind'] {
  if (/^[A-Z]/.test(name)) {
    if (name.endsWith('Interface') || name.endsWith('Type')) return 'interface';
    return 'class';
  }
  if (/^[A-Z_]+$/.test(name)) return 'const';
  if (name.includes('Type') || name.includes('Props')) return 'type';
  return 'function';
}

/**
 * Extract imports and exports from file content
 */
function extractImportsExports(content: string, filePath: string): {
  imports: string[];
  exports: string[];
} {
  const imports: string[] = [];
  const exports: string[] = [];
  
  // Match import statements
  const importRegex = /import\s+(?:{[^}]+}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Match export statements
  const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|type|interface)\s+([\w]+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  return { imports, exports };
}

/**
 * Extract symbols used in file (simple heuristic)
 */
function extractUsedSymbols(content: string): string[] {
  const symbols = new Set<string>();
  
  // Match function calls: functionName(
  const callRegex = /\b([a-z][a-zA-Z0-9]*)\s*\(/g;
  let match;
  while ((match = callRegex.exec(content)) !== null) {
    symbols.add(match[1]);
  }
  
  // Match class instantiations: new ClassName
  const newRegex = /\bnew\s+([A-Z][a-zA-Z0-9]*)/g;
  while ((match = newRegex.exec(content)) !== null) {
    symbols.add(match[1]);
  }
  
  // Match type references: : TypeName
  const typeRegex = /:\s*([A-Z][a-zA-Z0-9]*)/g;
  while ((match = typeRegex.exec(content)) !== null) {
    symbols.add(match[1]);
  }
  
  return Array.from(symbols);
}

/**
 * Get neighbor files (2 nearest siblings + tests + types)
 */
export function getNeighborFiles(
  root: string,
  targetFile: string,
  graph: CodeGraph
): string[] {
  const neighbors: string[] = [];
  const dir = path.dirname(targetFile);
  
  // 1. Get siblings in same directory
  const siblings = fs.readdirSync(path.join(root, dir))
    .filter(f => f !== path.basename(targetFile))
    .filter(f => /\.(ts|js|tsx|jsx|py|go|rs)$/.test(f))
    .slice(0, 2)
    .map(f => path.join(dir, f));
  
  neighbors.push(...siblings);
  
  // 2. Get test files
  const testPatterns = [
    targetFile.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1'),
    targetFile.replace(/\.(ts|js|tsx|jsx)$/, '.spec.$1'),
    targetFile.replace(/src\//, 'tests/').replace(/\.(ts|js|tsx|jsx)$/, '.test.$1'),
  ];
  
  for (const pattern of testPatterns) {
    if (fs.existsSync(path.join(root, pattern))) {
      neighbors.push(pattern);
    }
  }
  
  // 3. Get type definition files
  const typePatterns = [
    targetFile.replace(/\.(ts|js|tsx|jsx)$/, '.d.ts'),
    path.join(dir, 'types.ts'),
    path.join(dir, 'index.d.ts'),
  ];
  
  for (const pattern of typePatterns) {
    if (fs.existsSync(path.join(root, pattern))) {
      neighbors.push(pattern);
    }
  }
  
  return neighbors;
}

