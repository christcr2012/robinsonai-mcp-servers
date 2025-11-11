/**
 * Symbol Indexer
 * 
 * Builds an index of identifiers (functions, classes, variables, types) from the codebase.
 * Used to:
 * - Build domain glossary
 * - Extract naming examples
 * - Find public APIs
 * - Retrieve similar code
 * 
 * Uses simple regex-based parsing (fast, good enough for most cases).
 * For production, consider tree-sitter or TypeScript Compiler API.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Symbol {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'let' | 'var' | 'enum' | 'export';
  file: string;
  line: number;
  isPublic: boolean;
}

export interface SymbolIndex {
  symbols: Symbol[];
  byFile: Map<string, Symbol[]>;
  byName: Map<string, Symbol[]>;
  byType: Map<string, Symbol[]>;
}

/**
 * Build symbol index from a directory
 */
export async function buildSymbolIndex(
  root: string,
  options: {
    exts?: string[];
    maxFiles?: number;
    maxPerFileIds?: number;
    exclude?: string[];
  } = {}
): Promise<SymbolIndex> {
  const {
    exts = ['.ts', '.tsx', '.js', '.jsx'],
    maxFiles = 2000,
    maxPerFileIds = 200,
    exclude = ['node_modules', 'dist', 'build', '.next', 'coverage'],
  } = options;

  const index: SymbolIndex = {
    symbols: [],
    byFile: new Map(),
    byName: new Map(),
    byType: new Map(),
  };

  const files = await findFiles(root, exts, exclude, maxFiles);

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const symbols = extractSymbols(content, file, maxPerFileIds);
      
      index.symbols.push(...symbols);
      index.byFile.set(file, symbols);
      
      for (const symbol of symbols) {
        if (!index.byName.has(symbol.name)) {
          index.byName.set(symbol.name, []);
        }
        index.byName.get(symbol.name)!.push(symbol);
        
        if (!index.byType.has(symbol.type)) {
          index.byType.set(symbol.type, []);
        }
        index.byType.get(symbol.type)!.push(symbol);
      }
    } catch (error) {
      console.warn(`Failed to index ${file}:`, error);
    }
  }

  return index;
}

/**
 * Find files recursively
 */
async function findFiles(
  dir: string,
  exts: string[],
  exclude: string[],
  maxFiles: number
): Promise<string[]> {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    if (files.length >= maxFiles) return;
    
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(dir, fullPath);
      
      // Skip excluded directories
      if (exclude.some(ex => relativePath.startsWith(ex))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (exts.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Extract symbols from a file using regex
 */
function extractSymbols(content: string, file: string, maxIds: number): Symbol[] {
  const symbols: Symbol[] = [];
  const lines = content.split('\n');
  
  // Patterns for different symbol types
  const patterns = [
    // export function/const/class/interface/type
    { regex: /export\s+(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'function' as const, isPublic: true },
    { regex: /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'const' as const, isPublic: true },
    { regex: /export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'class' as const, isPublic: true },
    { regex: /export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'interface' as const, isPublic: true },
    { regex: /export\s+type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'type' as const, isPublic: true },
    { regex: /export\s+enum\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'enum' as const, isPublic: true },
    
    // non-export function/const/class/interface/type
    { regex: /^(?!export)\s*(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'function' as const, isPublic: false },
    { regex: /^(?!export)\s*const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'const' as const, isPublic: false },
    { regex: /^(?!export)\s*class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'class' as const, isPublic: false },
    { regex: /^(?!export)\s*interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'interface' as const, isPublic: false },
    { regex: /^(?!export)\s*type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'type' as const, isPublic: false },
    { regex: /^(?!export)\s*enum\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'enum' as const, isPublic: false },
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      if (symbols.length >= maxIds) break;
      
      const name = match[2] || match[1];
      if (!name) continue;
      
      // Find line number
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      symbols.push({
        name,
        type: pattern.type,
        file,
        line: lineNumber,
        isPublic: pattern.isPublic,
      });
    }
  }
  
  return symbols;
}

/**
 * Get top frequency identifiers (for glossary)
 */
export function topFrequencyIdentifiers(
  index: SymbolIndex,
  options: {
    minLen?: number;
    byDir?: string[];
    limit?: number;
  } = {}
): string[] {
  const { minLen = 3, byDir = [], limit = 50 } = options;
  
  const frequency = new Map<string, number>();
  
  for (const symbol of index.symbols) {
    // Filter by directory if specified
    if (byDir.length > 0 && !byDir.some(dir => symbol.file.includes(dir))) {
      continue;
    }
    
    // Filter by length
    if (symbol.name.length < minLen) {
      continue;
    }
    
    frequency.set(symbol.name, (frequency.get(symbol.name) || 0) + 1);
  }
  
  // Sort by frequency
  const sorted = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
  
  return sorted;
}

/**
 * Get public exports (for API surface)
 */
export function publicExports(
  index: SymbolIndex,
  patterns: string[]
): string[] {
  const exports: string[] = [];
  
  for (const symbol of index.symbols) {
    if (!symbol.isPublic) continue;
    
    // Check if file matches any pattern
    const matches = patterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(symbol.file);
    });
    
    if (matches) {
      exports.push(`${symbol.type} ${symbol.name} (${symbol.file}:${symbol.line})`);
    }
  }
  
  return exports;
}

/**
 * Collect naming examples from symbols
 */
export function collectNamingExamples(index: SymbolIndex): string[] {
  const examples: string[] = [];
  
  // Get examples of each type
  const types = ['function', 'class', 'interface', 'type', 'const', 'enum'];
  
  for (const type of types) {
    const symbols = index.byType.get(type as any) || [];
    const publicSymbols = symbols.filter(s => s.isPublic).slice(0, 5);
    
    for (const symbol of publicSymbols) {
      examples.push(`${type}: ${symbol.name}`);
    }
  }
  
  return examples;
}

/**
 * Infer naming convention from symbols
 */
export function inferNamingConvention(index: SymbolIndex): {
  variables: string;
  types: string;
  constants: string;
  files: string;
} {
  const variables = index.byType.get('const') || [];
  const types = [...(index.byType.get('class') || []), ...(index.byType.get('interface') || [])];
  
  // Analyze variable naming
  let camelCaseCount = 0;
  let snakeCaseCount = 0;
  
  for (const v of variables.slice(0, 100)) {
    if (/^[a-z][a-zA-Z0-9]*$/.test(v.name)) camelCaseCount++;
    if (/^[a-z][a-z0-9_]*$/.test(v.name)) snakeCaseCount++;
  }
  
  const variableStyle = camelCaseCount > snakeCaseCount ? 'camelCase' : 'snake_case';
  
  // Analyze type naming
  let pascalCaseCount = 0;
  
  for (const t of types.slice(0, 100)) {
    if (/^[A-Z][a-zA-Z0-9]*$/.test(t.name)) pascalCaseCount++;
  }
  
  const typeStyle = pascalCaseCount > types.length / 2 ? 'PascalCase' : 'unknown';
  
  // Analyze constant naming
  const constants = variables.filter(v => /^[A-Z_][A-Z0-9_]*$/.test(v.name));
  const constantStyle = constants.length > 10 ? 'UPPER_SNAKE_CASE' : 'unknown';
  
  // Analyze file naming
  const files = Array.from(new Set(index.symbols.map(s => path.basename(s.file))));
  let kebabCaseCount = 0;
  let camelCaseFileCount = 0;
  
  for (const file of files.slice(0, 100)) {
    const name = file.replace(/\.(ts|tsx|js|jsx)$/, '');
    if (/^[a-z][a-z0-9-]*$/.test(name)) kebabCaseCount++;
    if (/^[a-z][a-zA-Z0-9]*$/.test(name)) camelCaseFileCount++;
  }
  
  const fileStyle = kebabCaseCount > camelCaseFileCount ? 'kebab-case' : 'camelCase';
  
  return {
    variables: variableStyle,
    types: typeStyle,
    constants: constantStyle,
    files: fileStyle,
  };
}

