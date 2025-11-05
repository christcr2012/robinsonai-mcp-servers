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

  // Find all supported source files
  const sourceFiles = await fg(['**/*.{ts,tsx,cts,mts,js,jsx,mjs,cjs,py,go,java,kt,kts,rs,cpp,cc,cxx,c,h,hpp,hxx,ipp,cs,rb,php,swift,scala,m,mm,hs,vue,svelte}'], {
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
const INDEX_ALIAS: Record<string, string> = {
  '.tsx': '.ts',
  '.jsx': '.js',
  '.mjs': '.js',
  '.cjs': '.js',
  '.cts': '.ts',
  '.mts': '.ts',
  '.hpp': '.cpp',
  '.hxx': '.cpp',
  '.hh': '.cpp',
  '.ipp': '.cpp',
  '.cc': '.cpp',
  '.cxx': '.cpp',
  '.h': '.c',
  '.mm': '.m',
};

type PatternDescriptor = {
  regex: RegExp;
  type: Symbol['type'];
  nameIndex?: number;
  exportedGroup?: number;
};

const LANGUAGE_PATTERNS: Record<string, PatternDescriptor[]> = {
  '.ts': [
    { regex: /^(export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'function', nameIndex: 2 },
    { regex: /^(export\s+)?const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?(?:\(|[A-Za-z_$][A-Za-z0-9_$]*\s*=>)/gm, type: 'const', nameIndex: 2 },
    { regex: /^(export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'class', nameIndex: 2 },
    { regex: /^(export\s+)?interface\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'interface', nameIndex: 2 },
    { regex: /^(export\s+)?type\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'type', nameIndex: 2 },
    { regex: /^(export\s+)?enum\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'enum', nameIndex: 2 },
  ],
  '.js': [
    { regex: /^(export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'function', nameIndex: 2 },
    { regex: /^(export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?(?:\(|[A-Za-z_$][A-Za-z0-9_$]*\s*=>)/gm, type: 'const', nameIndex: 2 },
    { regex: /^(export\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm, type: 'class', nameIndex: 2 },
  ],
  '.py': [
    { regex: /^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1 },
    { regex: /^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
  ],
  '.go': [
    { regex: /^\s*func\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1 },
    { regex: /^\s*type\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'type', nameIndex: 1 },
  ],
  '.java': [
    { regex: /^(?:public|protected|private|static|final|abstract|synchronized|\s)*class\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^(?:public|protected|private|static|abstract|\s)*interface\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'interface', nameIndex: 1 },
    { regex: /^(?:public|protected|private|static|final|abstract|synchronized|native|strictfp|default|\s)+[\w<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1 },
  ],
  '.kt': [
    { regex: /^(?:public|internal|private|protected|abstract|data|sealed|open|inline|value|suspend|\s)*class\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^(?:public|internal|private|protected|abstract|suspend|tailrec|infix|operator|inline|\s)*fun\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'function', nameIndex: 1 },
  ],
  '.kts': [
    { regex: /^(?:public|internal|private|protected|suspend|inline|\s)*fun\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'function', nameIndex: 1 },
  ],
  '.rs': [
    { regex: /^(?:pub\s+)?fn\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'function', nameIndex: 1 },
    { regex: /^(?:pub\s+)?struct\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^(?:pub\s+)?enum\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'enum', nameIndex: 1 },
    { regex: /^(?:pub\s+)?trait\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'interface', nameIndex: 1 },
  ],
  '.cpp': [
    { regex: /^(?:template\s*<[^>]+>\s*)?(?:class|struct)\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^(?:inline\s+)?(?:static\s+)?(?:constexpr\s+)?[A-Za-z_][\w:\*<>,\s]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1 },
  ],
  '.c': [
    { regex: /^(?:static\s+)?[A-Za-z_][\w\*\s]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1 },
    { regex: /^typedef\s+struct\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'type', nameIndex: 1 },
  ],
  '.cs': [
    { regex: /^(?:public|private|protected|internal|static|abstract|sealed|partial|\s)*class\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^(?:public|private|protected|internal|static|abstract|sealed|\s)*interface\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'interface', nameIndex: 1 },
    { regex: /^(?:public|private|protected|internal|static|async|sealed|override|virtual|\s)+[\w<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1 },
  ],
  '.rb': [
    { regex: /^\s*(?:class|module)\s+([A-Za-z_][A-Za-z0-9_!?]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^\s*def\s+([A-Za-z_][A-Za-z0-9_!?]*)/gm, type: 'function', nameIndex: 1 },
  ],
  '.php': [
    { regex: /^(?:abstract\s+|final\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^(?:public|protected|private|static|final|abstract|\s)*function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1 },
  ],
  '.swift': [
    { regex: /^(?:public|internal|private|open|fileprivate|\s)*(?:class|struct|enum|protocol|extension)\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^(?:public|internal|private|open|fileprivate|static|mutating|nonmutating|\s)*func\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'function', nameIndex: 1 },
  ],
  '.scala': [
    { regex: /^(?:final\s+|sealed\s+|abstract\s+|case\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^(?:trait|object)\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'interface', nameIndex: 1 },
    { regex: /^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'function', nameIndex: 1 },
  ],
  '.m': [
    { regex: /^@interface\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^@implementation\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^[-+]\s*\([^)]+\)\s*([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'function', nameIndex: 1 },
  ],
  '.mm': [
    { regex: /^@interface\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^@implementation\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'class', nameIndex: 1 },
    { regex: /^[-+]\s*\([^)]+\)\s*([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'function', nameIndex: 1 },
  ],
  '.hs': [
    { regex: /^\s*([A-Za-z_][A-Za-z0-9_']*)\s*::/gm, type: 'function', nameIndex: 1 },
    { regex: /^\s*(?:data|newtype)\s+([A-Za-z_][A-Za-z0-9_']*)/gm, type: 'type', nameIndex: 1 },
  ],
  '.vue': [
    { regex: /name:\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/gm, type: 'class', nameIndex: 1 },
    { regex: /methods:\s*{[^}]*([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1 },
  ],
  '.svelte': [
    { regex: /export\s+let\s+([A-Za-z_][A-Za-z0-9_]*)/gm, type: 'const', nameIndex: 1 },
    { regex: /function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm, type: 'function', nameIndex: 1 },
  ],
};

function normalizeIndexExt(ext: string): string {
  const lower = ext.toLowerCase();
  return INDEX_ALIAS[lower] ?? lower;
}

function extractSymbols(filePath: string, repoRoot: string): Symbol[] {
  const symbols: Symbol[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(repoRoot, filePath);
    const ext = normalizeIndexExt(path.extname(filePath));
    const patterns = LANGUAGE_PATTERNS[ext] || [];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g');
      while ((match = regex.exec(content)) !== null) {
        const name = match[pattern.nameIndex ?? 1];
        if (!name) continue;

        const index = match.index;
        const lineNumber = content.substring(0, index).split('\n').length;
        const exportedGroup = pattern.exportedGroup ?? 1;
        const rawExport = match[exportedGroup];
        const isExported = rawExport ? /export|public|protected/.test(rawExport) : false;

        symbols.push({
          name,
          type: pattern.type,
          file: relativePath,
          line: lineNumber,
          isPublic: isExported || /^[A-Z]/.test(name),
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

