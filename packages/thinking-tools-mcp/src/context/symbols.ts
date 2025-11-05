const EXT_ALIAS: Record<string, string> = {
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

type SymbolExtractor = (text: string) => string[];

const SYMBOL_PATTERNS: Record<string, SymbolExtractor[]> = {
  '.ts': [
    (text) => matchAll(text, /function\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /class\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /interface\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /type\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /(?:const|let)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?(?:\(|[A-Za-z_][A-Za-z0-9_]*\s*=>)/g),
  ],
  '.js': [
    (text) => matchAll(text, /function\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /class\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?(?:\(|[A-Za-z_][A-Za-z0-9_]*\s*=>)/g),
    (text) => matchAll(text, /module\.exports\s*=\s*{?\s*([A-Za-z_][A-Za-z0-9_]*)/g),
  ],
  '.py': [
    (text) => matchAll(text, /def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g),
    (text) => matchAll(text, /class\s+([A-Za-z_][A-Za-z0-9_]*)\s*[:(]/g),
  ],
  '.go': [
    (text) => matchAll(text, /func\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g),
    (text) => matchAll(text, /type\s+([A-Za-z_][A-Za-z0-9_]*)\s+/g),
  ],
  '.java': [
    (text) => matchAll(text, /class\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /interface\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /enum\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /(?:public|protected|private|static|final|abstract|synchronized)\s+[\w<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g),
  ],
  '.kt': [
    (text) => matchAll(text, /(?:class|object|interface)\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g),
  ],
  '.kts': [
    (text) => matchAll(text, /fun\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g),
  ],
  '.rs': [
    (text) => matchAll(text, /(?:pub\s+)?fn\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /(?:pub\s+)?struct\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /(?:pub\s+)?enum\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /(?:pub\s+)?trait\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /mod\s+([A-Za-z_][A-Za-z0-9_]*)/g),
  ],
  '.cpp': [
    (text) => matchAll(text, /class\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /struct\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /([A-Za-z_][\w:\*<>,\s]+)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, 2),
  ],
  '.c': [
    (text) => matchAll(text, /([A-Za-z_][\w\*\s]+)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, 2),
    (text) => matchAll(text, /typedef\s+struct\s+([A-Za-z_][A-Za-z0-9_]*)/g),
  ],
  '.cs': [
    (text) => matchAll(text, /class\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /interface\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /enum\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /(?:public|private|protected|internal|static|async|sealed|abstract)\s+[\w<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g),
  ],
  '.rb': [
    (text) => matchAll(text, /(?:class|module|def)\s+([A-Za-z_][A-Za-z0-9_!?]*)/g),
  ],
  '.php': [
    (text) => matchAll(text, /class\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g),
  ],
  '.swift': [
    (text) => matchAll(text, /(?:class|struct|enum|protocol|extension|func)\s+([A-Za-z_][A-Za-z0-9_]*)/g),
  ],
  '.scala': [
    (text) => matchAll(text, /(?:class|trait|object|def)\s+([A-Za-z_][A-Za-z0-9_]*)/g),
  ],
  '.m': [
    (text) => matchAll(text, /@interface\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /@implementation\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /[-+]\s*\([^)]+\)\s*([A-Za-z_][A-Za-z0-9_]*)/g),
  ],
  '.mm': [
    (text) => matchAll(text, /@interface\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /@implementation\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    (text) => matchAll(text, /[-+]\s*\([^)]+\)\s*([A-Za-z_][A-Za-z0-9_]*)/g),
  ],
  '.hs': [
    (text) => matchAll(text, /([A-Za-z_][A-Za-z0-9_']*)\s*::/g, 1),
    (text) => matchAll(text, /data\s+([A-Za-z_][A-Za-z0-9_']*)/g),
  ],
  '.vue': [
    (text) => matchAll(text, /export\s+default\s+{\s*name:\s*['"]([A-Za-z_][A-Za-z0-9_]*)/g),
  ],
  '.svelte': [
    (text) => matchAll(text, /export\s+let\s+([A-Za-z_][A-Za-z0-9_]*)/g),
  ],
};

function normalizeExtension(ext: string): string {
  const lower = ext.toLowerCase();
  return EXT_ALIAS[lower] ?? lower;
}

function matchAll(text: string, regex: RegExp, group = 1): string[] {
  const out: string[] = [];
  let match: RegExpExecArray | null;
  const cloned = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  while ((match = cloned.exec(text)) !== null) {
    const value = match[group];
    if (value) out.push(value.trim());
  }
  return out;
}

export function extractSymbols(langExt: string, text: string): string[] {
  const normalized = normalizeExtension(langExt);
  const out = new Set<string>();
  const patterns = SYMBOL_PATTERNS[normalized] || [];

  for (const extractor of patterns) {
    try {
      for (const symbol of extractor(text)) {
        if (symbol) out.add(symbol);
      }
    } catch {
      // ignore extractor failures
    }
  }

  if (out.size === 0) {
    for (const match of matchAll(text, /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
      out.add(match);
    }
  }

  return Array.from(out).slice(0, 200);
}

