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

  // Find all relevant source files
  const sourceFiles = await fg(['**/*.{ts,tsx,js,jsx,py,go,java,rs,cpp,cxx,cc,c,h,cs}'], {
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
interface LanguagePattern {
  regex: RegExp;
  type: Symbol['type'];
  nameIndex: number;
  exportIndex?: number;
  publicTest?: (name: string) => boolean;
}

function getLanguagePatterns(ext: string): LanguagePattern[] {
  switch (ext) {
    case '.py':
      return [
        { regex: /^class\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1, publicTest: name => !name.startsWith('_') },
        { regex: /^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1, publicTest: name => !name.startsWith('_') },
      ];
    case '.go':
      return [
        { regex: /^type\s+([A-Za-z_][A-Za-z0-9_]*)\s+struct/gm, type: 'type', nameIndex: 1, publicTest: name => /^[A-Z]/.test(name) },
        { regex: /^func\s+(?:\([^)]+\)\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1, publicTest: name => /^[A-Z]/.test(name) },
        { regex: /^const\s+([A-Z_][A-Z0-9_]*)\s*=/gm, type: 'const', nameIndex: 1, publicTest: () => true },
      ];
    case '.java':
    case '.kt':
      return [
        { regex: /^(public\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 2, exportIndex: 1, publicTest: name => true },
        { regex: /^(public\s+)?interface\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'interface', nameIndex: 2, exportIndex: 1, publicTest: name => true },
        { regex: /^(public\s+)?enum\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'enum', nameIndex: 2, exportIndex: 1, publicTest: name => true },
        { regex: /^(public\s+)?(?:static\s+)?(?:final\s+)?[\w<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 2, exportIndex: 1 },
      ];
    case '.rs':
      return [
        { regex: /^pub\s+struct\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'type', nameIndex: 1, exportIndex: 0, publicTest: () => true },
        { regex: /^pub\s+enum\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'enum', nameIndex: 1, exportIndex: 0, publicTest: () => true },
        { regex: /^(pub\s+)?fn\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'function', nameIndex: 2, exportIndex: 1, publicTest: name => !name.startsWith('_') },
      ];
    case '.cpp':
    case '.cxx':
    case '.cc':
    case '.c':
    case '.hpp':
    case '.h':
      return [
        { regex: /^(?:template<[^>]+>\s*)?(class|struct)\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 2, publicTest: () => true },
        { regex: /^(?:inline\s+)?(?:static\s+)?[\w:\*\&<>]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1, publicTest: name => !name.startsWith('_') },
      ];
    case '.cs':
      return [
        { regex: /^(public\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 2, exportIndex: 1 },
        { regex: /^(public\s+)?interface\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'interface', nameIndex: 2, exportIndex: 1 },
        { regex: /^(public\s+)?enum\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'enum', nameIndex: 2, exportIndex: 1 },
        { regex: /^(public\s+)?(?:static\s+)?[\w<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 2, exportIndex: 1 },
      ];
    default:
      return [
        { regex: /^(export\s+)?(async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'function', nameIndex: 3, exportIndex: 1 },
        { regex: /^(export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(async\s+)?\(/gm, type: 'const', nameIndex: 2, exportIndex: 1 },
        { regex: /^(export\s+)?(abstract\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'class', nameIndex: 3, exportIndex: 1 },
        { regex: /^(export\s+)?interface\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'interface', nameIndex: 2, exportIndex: 1 },
        { regex: /^(export\s+)?type\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'type', nameIndex: 2, exportIndex: 1 },
        { regex: /^(export\s+)?enum\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'enum', nameIndex: 2, exportIndex: 1 },
        { regex: /^export\s+const\s+([A-Z_][A-Z0-9_]*)\s*=/gm, type: 'const', nameIndex: 1, exportIndex: 0, publicTest: () => true },
      ];
  }
}

function extractSymbols(filePath: string, repoRoot: string): Symbol[] {
  const symbols: Symbol[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(repoRoot, filePath);

    const ext = path.extname(filePath).toLowerCase();
    const patterns = getLanguagePatterns(ext);

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.regex.exec(content)) !== null) {
        const rawName = match[pattern.nameIndex];
        if (!rawName) continue;
        const name = rawName.replace(/[({:].*$/, '').trim();

        if (!name) continue;

        const lineNumber = content.substring(0, match.index).split('\n').length;
        const exported = pattern.exportIndex !== undefined ? Boolean(match[pattern.exportIndex]) : /^[A-Z]/.test(name);
        const isPublic = pattern.publicTest ? pattern.publicTest(name) : exported || /^[A-Z]/.test(name);

        symbols.push({
          name,
          type: pattern.type,
          file: relativePath,
          line: lineNumber,
          isPublic,
          isExported: exported
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

