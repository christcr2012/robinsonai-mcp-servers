import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import { extractSymbolsForFile } from './languages.js';

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

  // Find all supported source files
  const sourceFiles = await fg(['**/*.{ts,tsx,js,jsx,py,go,java,rs,cpp,cxx,cc,h,hpp,hh}'], {
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
    try {
      const fileSymbols = await extractSymbolsForFile(file, repoRoot);
      symbols.push(...fileSymbols.map(s => ({ ...s })));
    } catch (error) {
      console.warn(`[buildSymbolIndex] Failed to extract symbols for ${file}:`, (error as Error).message);
    }
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

  // Extract imports: find symbols used in this file that are defined elsewhere
  const imports: string[] = [];
  const symbolsInFile = new Set(symbols.map(s => s.name));

  // Look through all symbols in the index
  for (const symbol of index.symbols) {
    // If this symbol is used in our file but defined elsewhere, it's an import
    if (symbol.file !== file && symbolsInFile.has(symbol.name)) {
      imports.push(symbol.file);
    }
  }

  // Find files that import this file: look for symbols defined here used elsewhere
  const importedBy: string[] = [];
  const symbolsDefinedHere = symbols.filter(s => s.isExported);

  for (const definedSymbol of symbolsDefinedHere) {
    // Find all occurrences of this symbol in other files
    const symbolOccurrences = index.byName.get(definedSymbol.name) || [];
    for (const occurrence of symbolOccurrences) {
      if (occurrence.file !== file) {
        importedBy.push(occurrence.file);
      }
    }
  }

  return {
    symbols,
    imports: Array.from(new Set(imports)),
    importedBy: Array.from(new Set(importedBy))
  };
}

