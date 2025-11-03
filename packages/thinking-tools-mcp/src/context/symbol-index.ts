import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';

export interface Symbol {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'let' | 'var' | 'enum';
  file: string;
  line: number;
  isPublic: boolean;
  isExported: boolean;
}

export interface SymbolIndex {
  symbols: Symbol[];
  files: string[];
  byName: Map<string, Symbol[]>;
  byFile: Map<string, Symbol[]>;
}

/**
 * Build symbol index for repository
 * Extracts functions, classes, interfaces, types, and exported constants
 */
export async function buildSymbolIndex(repoRoot = process.cwd()): Promise<SymbolIndex> {
  const symbols: Symbol[] = [];
  const files: string[] = [];

  // Find all TypeScript/JavaScript files
  const sourceFiles = await fg(['**/*.{ts,tsx,js,jsx}'], {
    cwd: repoRoot,
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/__generated__/**',
      '**/.venv*/**',
      '**/site-packages/**'
    ],
    absolute: true
  });

  for (const file of sourceFiles) {
    files.push(file);
    const fileSymbols = extractSymbols(file, repoRoot);
    symbols.push(...fileSymbols);
  }

  // Build lookup maps
  const byName = new Map<string, Symbol[]>();
  const byFile = new Map<string, Symbol[]>();

  for (const symbol of symbols) {
    // By name
    if (!byName.has(symbol.name)) {
      byName.set(symbol.name, []);
    }
    byName.get(symbol.name)!.push(symbol);

    // By file
    if (!byFile.has(symbol.file)) {
      byFile.set(symbol.file, []);
    }
    byFile.get(symbol.file)!.push(symbol);
  }

  console.log(`[buildSymbolIndex] Indexed ${symbols.length} symbols from ${files.length} files`);

  return { symbols, files, byName, byFile };
}

/**
 * Extract symbols from a single file
 */
function extractSymbols(filePath: string, repoRoot: string): Symbol[] {
  const symbols: Symbol[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(repoRoot, filePath);

    // Regex patterns for different symbol types
    const patterns = [
      // Functions: export function foo() / function foo()
      { regex: /^(export\s+)?(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'function' as const },
      
      // Arrow functions: export const foo = () => / const foo = async () =>
      { regex: /^(export\s+)?const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(async\s+)?\(/gm, type: 'const' as const },
      
      // Classes: export class Foo / class Foo
      { regex: /^(export\s+)?(abstract\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'class' as const },
      
      // Interfaces: export interface Foo / interface Foo
      { regex: /^(export\s+)?interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'interface' as const },
      
      // Types: export type Foo / type Foo
      { regex: /^(export\s+)?type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'type' as const },
      
      // Enums: export enum Foo / enum Foo
      { regex: /^(export\s+)?enum\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/gm, type: 'enum' as const },
      
      // Exported constants: export const FOO
      { regex: /^export\s+const\s+([A-Z_][A-Z0-9_]*)\s*=/gm, type: 'const' as const }
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const isExported = match[1] !== undefined;
        const name = pattern.type === 'function' || pattern.type === 'class' || pattern.type === 'interface' || pattern.type === 'type' || pattern.type === 'enum'
          ? match[3] || match[2]
          : match[2] || match[1];

        if (!name) continue;

        // Find line number
        const lineNumber = content.substring(0, match.index).split('\n').length;

        symbols.push({
          name,
          type: pattern.type,
          file: relativePath,
          line: lineNumber,
          isPublic: isExported || /^[A-Z]/.test(name), // Exported or PascalCase
          isExported
        });
      }
    }
  } catch (error) {
    console.error(`[extractSymbols] Error processing ${filePath}:`, error);
  }

  return symbols;
}

/**
 * Find symbol definition by name
 */
export function findSymbolDefinition(symbolName: string, index: SymbolIndex): Symbol | null {
  const matches = index.byName.get(symbolName);
  if (!matches || matches.length === 0) return null;
  
  // Prefer exported symbols
  const exported = matches.find(s => s.isExported);
  if (exported) return exported;
  
  // Otherwise return first match
  return matches[0];
}

/**
 * Get all symbols in a file
 */
export function getFileSymbols(file: string, index: SymbolIndex): Symbol[] {
  return index.byFile.get(file) || [];
}

/**
 * Find all callers of a function (simplified - looks for function name in other files)
 */
export function findCallers(functionName: string, index: SymbolIndex, repoRoot = process.cwd()): Array<{ file: string; line: number; context: string }> {
  const callers: Array<{ file: string; line: number; context: string }> = [];
  
  // Search all files for references to this function
  for (const file of index.files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for function calls: functionName(
        if (line.includes(`${functionName}(`)) {
          const relativePath = path.relative(repoRoot, file);
          callers.push({
            file: relativePath,
            line: i + 1,
            context: line.trim()
          });
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  return callers;
}

/**
 * Get file neighborhood (symbols in file + imports + importers)
 */
export function getFileNeighborhood(file: string, index: SymbolIndex): {
  symbols: Symbol[];
  imports: string[];
  importedBy: string[];
} {
  const symbols = getFileSymbols(file, index);
  
  // TODO: Extract imports from file
  const imports: string[] = [];
  
  // TODO: Find files that import this file
  const importedBy: string[] = [];
  
  return { symbols, imports, importedBy };
}

