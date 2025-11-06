/**
 * Lightweight language heuristics for symbol extraction.
 * Used by tests to ensure we can reason about public/private exports
 * without requiring the heavyweight tree-sitter pipeline.
 */

export type SymbolKind = 'function' | 'class' | 'struct' | 'enum' | 'module' | 'type';

export interface SymbolMatch {
  name: string;
  kind: SymbolKind;
  exported: boolean;
}

const PY_DEF = /^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/;
const PY_CLASS = /^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\s*[:\(]/;

const GO_FUNC = /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/;
const GO_TYPE = /^\s*type\s+([A-Za-z_][A-Za-z0-9_]*)\s+/;

const RUST_PUB_FN = /^\s*pub\s+fn\s+([A-Za-z_][A-Za-z0-9_]*)/;
const RUST_FN = /^\s*fn\s+([A-Za-z_][A-Za-z0-9_]*)/;
const RUST_PUB_STRUCT = /^\s*pub\s+struct\s+([A-Za-z_][A-Za-z0-9_]*)/;
const RUST_STRUCT = /^\s*struct\s+([A-Za-z_][A-Za-z0-9_]*)/;
const RUST_PUB_ENUM = /^\s*pub\s+enum\s+([A-Za-z_][A-Za-z0-9_]*)/;
const RUST_PUB_MOD = /^\s*pub\s+mod\s+([A-Za-z_][A-Za-z0-9_]*)/;

function upcaseExported(name: string): boolean {
  return /^[A-Z]/.test(name);
}

function notPrefixedUnderscore(name: string): boolean {
  return !name.startsWith('_');
}

/**
 * Extract lightweight symbol information based on filename extension.
 */
export function extractSymbolMatches(source: string, fileExt: string): SymbolMatch[] {
  const ext = (fileExt || '').toLowerCase();
  const lines = source.split(/\r?\n/);
  const results: SymbolMatch[] = [];
  const seen = new Set<string>();

  function add(name: string, kind: SymbolKind, exported: boolean) {
    const key = `${kind}:${name}`;
    if (!name || seen.has(key)) return;
    seen.add(key);
    results.push({ name, kind, exported });
  }

  if (ext === '.py') {
    for (const line of lines) {
      const fnMatch = line.match(PY_DEF);
      if (fnMatch) {
        const name = fnMatch[1];
        add(name, 'function', notPrefixedUnderscore(name));
        continue;
      }

      const classMatch = line.match(PY_CLASS);
      if (classMatch) {
        const name = classMatch[1];
        add(name, 'class', notPrefixedUnderscore(name));
      }
    }
    return results;
  }

  if (ext === '.go') {
    for (const line of lines) {
      const funcMatch = line.match(GO_FUNC);
      if (funcMatch) {
        const name = funcMatch[1];
        add(name, 'function', upcaseExported(name));
        continue;
      }

      const typeMatch = line.match(GO_TYPE);
      if (typeMatch) {
        const name = typeMatch[1];
        add(name, 'type', upcaseExported(name));
      }
    }
    return results;
  }

  if (ext === '.rs') {
    for (const line of lines) {
      let match: RegExpMatchArray | null;

      match = line.match(RUST_PUB_FN);
      if (match) {
        add(match[1], 'function', true);
        continue;
      }

      match = line.match(RUST_FN);
      if (match) {
        add(match[1], 'function', false);
        continue;
      }

      match = line.match(RUST_PUB_STRUCT);
      if (match) {
        add(match[1], 'struct', true);
        continue;
      }

      match = line.match(RUST_STRUCT);
      if (match) {
        add(match[1], 'struct', false);
        continue;
      }

      match = line.match(RUST_PUB_ENUM);
      if (match) {
        add(match[1], 'enum', true);
        continue;
      }

      match = line.match(RUST_PUB_MOD);
      if (match) {
        add(match[1], 'module', true);
        continue;
      }
    }
    return results;
  }

  // Fallback: best-effort to capture common export keywords (public types/functions)
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^export\s+(?:class|function|const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)/.test(trimmed)) {
      const name = RegExp.$1;
      add(name, 'function', true);
    } else if (/^class\s+([A-Za-z_][A-Za-z0-9_]*)/.test(trimmed)) {
      const name = RegExp.$1;
      add(name, 'class', true);
    } else if (/^function\s+([A-Za-z_][A-Za-z0-9_]*)/.test(trimmed)) {
      const name = RegExp.$1;
      add(name, 'function', true);
    }
  }

  return results;
}
