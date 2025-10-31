/*
  Portable Repo-Native Toolkit (TypeScript)
  ----------------------------------------
  Three building blocks:
   1) namingStyleDetector – infer dominant naming styles (camelCase, PascalCase, snake_case, UPPER_SNAKE_CASE, kebab-case)
   2) lightweightSymbolIndexer – crawl a repo, collect identifiers and a tiny import graph
   3) capabilitiesProbe – detect languages, formatters, linters, typecheckers, tests, and schema sources

  Usage (with ts-node):
    npx ts-node repo_portable_tools.ts detect-naming <repoRoot>
    npx ts-node repo_portable_tools.ts index <repoRoot> [--exts .ts,.tsx,.js,.py,.go,.rs]
    npx ts-node repo_portable_tools.ts probe <repoRoot>

  Notes:
    - Zero external deps; pure Node APIs. (Optionally faster if you later swap in fast-glob/ripgrep.)
    - Safe defaults skip heavy dirs: node_modules, .git, dist, build, .venv, target, out
    - Designed to be embedded inside an agent. Exported functions at bottom.
*/

import * as fs from 'fs';
import * as path from 'path';

// -----------------------------
// 1) NAMING STYLE DETECTOR
// -----------------------------

type NamingCase = 'camelCase' | 'PascalCase' | 'snake_case' | 'UPPER_SNAKE_CASE' | 'kebab-case' | 'unknown';

const CASE_TESTS: Record<NamingCase, (s: string) => boolean> = {
  camelCase: (s) => /^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(s),
  PascalCase: (s) => /^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)*$/.test(s),
  snake_case: (s) => /^[a-z]+(?:_[a-z0-9]+)+$/.test(s),
  UPPER_SNAKE_CASE: (s) => /^[A-Z]+(?:_[A-Z0-9]+)+$/.test(s),
  'kebab-case': (s) => /^[a-z]+(?:-[a-z0-9]+)+$/.test(s),
  unknown: (_) => false,
};

function detectCase(token: string): NamingCase {
  if (CASE_TESTS.camelCase(token)) return 'camelCase';
  if (CASE_TESTS.PascalCase(token)) return 'PascalCase';
  if (CASE_TESTS.snake_case(token)) return 'snake_case';
  if (CASE_TESTS.UPPER_SNAKE_CASE(token)) return 'UPPER_SNAKE_CASE';
  if (CASE_TESTS['kebab-case'](token)) return 'kebab-case';
  return 'unknown';
}

export function namingStyleDetector(tokens: string[]) {
  const counts: Record<NamingCase, number> = {
    camelCase: 0, PascalCase: 0, snake_case: 0, UPPER_SNAKE_CASE: 0, 'kebab-case': 0, unknown: 0,
  };
  for (const t of tokens) counts[detectCase(t)]++;

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const recommend = (role: 'var'|'type'|'const') => {
    // Simple heuristic: prefer commonly seen cases by role
    if (role === 'type') return (counts.PascalCase >= counts.camelCase ? 'PascalCase' : 'camelCase');
    if (role === 'const') return (counts.UPPER_SNAKE_CASE >= counts.snake_case ? 'UPPER_SNAKE_CASE' : 'snake_case');
    return (counts.camelCase >= counts.snake_case ? 'camelCase' : 'snake_case');
  };

  return {
    counts,
    majority: sorted[0][0] as NamingCase,
    recommendation: {
      var: recommend('var'),
      type: recommend('type'),
      const: recommend('const'),
    }
  };
}

// Extract identifiers from a buffer (very light, language-agnostic-ish)
export function extractIdentifiers(buffer: string): string[] {
  // Remove strings/comments crudely to avoid overcounting casing inside prose
  const scrubbed = buffer
    // JS/TS/Python/Go single-line comments
    .replace(/\/\/.*$/mg, '')
    .replace(/#.*$/mg, '')
    // block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:\\.|[^"\\])*"/g, ' ')
    .replace(/'(?:\\.|[^'\\])*'/g, ' ')
    .replace(/`(?:\\.|[^`\\])*`/g, ' ');

  const rawTokens = scrubbed.match(/[A-Za-z_][A-Za-z0-9_\-]*/g) || [];
  // Filter out likely keywords
  const stop = new Set(['class','function','def','return','var','let','const','if','else','for','while','switch','case','break','continue','import','from','export','package','type','interface','struct','enum','impl','pub']);
  return rawTokens.filter(t => !stop.has(t) && t.length > 2 && /[A-Za-z]/.test(t));
}

// -----------------------------
// 2) LIGHTWEIGHT SYMBOL INDEXER
// -----------------------------

type IndexOptions = { exts?: string[], maxFiles?: number };
const DEFAULT_EXTS = ['.ts','.tsx','.js','.jsx','.mjs','.cjs','.py','.go','.rs','.java','.kt'];
const SKIP_DIRS = new Set(['node_modules','.git','dist','build','.venv','target','out','.next','.turbo','coverage']);

export type SymbolIndex = {
  files: string[];
  identifiers: Record<string, number>; // token -> count
  byFile: Record<string, string[]>;    // file -> identifiers found
  imports: Array<{ from: string; to: string }>; // tiny import graph (path strings)
};

export async function lightweightSymbolIndexer(root: string, opts: IndexOptions = {}): Promise<SymbolIndex> {
  const exts = (opts.exts && opts.exts.length ? opts.exts : DEFAULT_EXTS).map(e => e.toLowerCase());
  const maxFiles = opts.maxFiles ?? 5000;
  const files: string[] = [];

  // DFS traversal with skip list
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (files.length >= maxFiles) return;
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(path.join(dir, e.name));
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (exts.includes(ext)) files.push(path.join(dir, e.name));
      }
    }
  }
  walk(root);

  const identifiers: Record<string, number> = {};
  const byFile: Record<string, string[]> = {};
  const imports: Array<{from:string; to:string}> = [];

  for (const f of files) {
    try {
      const buf = fs.readFileSync(f, 'utf8');
      const ids = extractIdentifiers(buf);
      byFile[f] = ids;
      for (const t of ids) identifiers[t] = (identifiers[t] ?? 0) + 1;

      // crude import detection that works across JS/TS/Py/Go/Rust
      const lines = buf.split(/\r?\n/);
      for (const line of lines) {
        let m: RegExpExecArray | null;
        const patterns = [
          /import\s+[^'"`]*['"`]([^'"`]+)['"`]/,            // JS/TS ESM
          /require\(['"`]([^'"`]+)['"`]\)/,                 // CJS
          /from\s+['"]([^'"]+)['"]/,
          /from\s+([a-zA-Z0-9_\.]+)/,                         // Python: from X import Y
          /import\s+([a-zA-Z0-9_\.]+)/,                       // Python: import X
          /use\s+([a-zA-Z0-9_:\/]+)::?/,                      // Rust use path
          /package\s+([a-zA-Z0-9_\.\/]+)/                     // Go package (shallow)
        ];
        for (const p of patterns) {
          m = p.exec(line);
          if (m && m[1]) { imports.push({ from: f, to: m[1] }); break; }
        }
      }
    } catch { /* ignore */ }
  }

  return { files, identifiers, byFile, imports };
}

// -----------------------------
// 3) CAPABILITIES PROBE
// -----------------------------

export type Capabilities = {
  langs: string[];
  formatters: string[];
  linters: string[];
  typecheckers: string[];
  tests: string[];
  schemas: string[];
};

function exists(p: string) { try { return fs.existsSync(p); } catch { return false; } }
function hasAny(root: string, names: string[]) { return names.some(n => exists(path.join(root, n))); }

function readJSONSafe(p: string): any | null { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }

export async function capabilitiesProbe(root: string): Promise<Capabilities> {
  const langs: string[] = [];
  if (hasAny(root, ['package.json'])) langs.push('ts/js');
  if (hasAny(root, ['pyproject.toml','requirements.txt','setup.cfg'])) langs.push('py');
  if (hasAny(root, ['go.mod'])) langs.push('go');
  if (hasAny(root, ['Cargo.toml'])) langs.push('rust');
  if (hasAny(root, ['pom.xml','build.gradle','build.gradle.kts'])) langs.push('java/kotlin');

  const formatters: string[] = [];
  if (hasAny(root, ['.prettierrc','.prettierrc.js','.prettierrc.cjs','prettier.config.js'])) formatters.push('prettier');
  if (hasAny(root, ['.editorconfig'])) formatters.push('editorconfig');
  if (hasAny(root, ['pyproject.toml'])) formatters.push('black?');
  if (hasAny(root, ['rustfmt.toml'])) formatters.push('rustfmt');

  const linters: string[] = [];
  if (hasAny(root, ['.eslintrc.js','.eslintrc.cjs','.eslintrc.json'])) linters.push('eslint');
  if (hasAny(root, ['ruff.toml','.ruff.toml'])) linters.push('ruff');
  if (hasAny(root, ['flake8.cfg','.flake8'])) linters.push('flake8');
  if (hasAny(root, ['.golangci.yml','golangci.yml'])) linters.push('golangci-lint');
  if (hasAny(root, ['.clippy.toml'])) linters.push('clippy');

  const typecheckers: string[] = [];
  if (hasAny(root, ['tsconfig.json'])) typecheckers.push('tsc');
  if (hasAny(root, ['pyrightconfig.json'])) typecheckers.push('pyright');
  if (hasAny(root, ['mypy.ini'])) typecheckers.push('mypy');

  const tests: string[] = [];
  if (hasAny(root, ['jest.config.js','jest.config.ts','vitest.config.ts'])) tests.push('jest/vitest');
  if (hasAny(root, ['pytest.ini','conftest.py','tox.ini'])) tests.push('pytest');
  if (hasAny(root, ['go.mod'])) tests.push('go test');
  if (hasAny(root, ['Cargo.toml'])) tests.push('cargo test');
  if (hasAny(root, ['pom.xml','build.gradle','build.gradle.kts'])) tests.push('junit');

  const schemas: string[] = [];
  if (hasAny(root, ['openapi.yaml','openapi.yml','openapi.json'])) schemas.push('openapi');
  if (hasAny(root, ['schema.graphql','graphql.schema.json'])) schemas.push('graphql');
  if (hasAny(root, ['prisma/schema.prisma'])) schemas.push('prisma');
  // quick scan of migrations dirs
  const migDirs = ['migrations','db/migrations','database/migrations'];
  if (migDirs.some(d => exists(path.join(root, d)))) schemas.push('sql-migrations');

  // enrich from package.json if present
  const pkg = readJSONSafe(path.join(root, 'package.json'));
  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string,string>;
    if (deps) {
      if (deps['prettier']) formatters.push('prettier');
      if (deps['eslint']) linters.push('eslint');
      if (deps['typescript']) typecheckers.push('tsc');
      if (deps['jest'] || deps['vitest']) tests.push(deps['vitest']? 'vitest':'jest');
      if (deps['@openapitools/openapi-generator-cli'] || deps['openapi-typescript']) schemas.push('openapi');
      if (deps['@graphql-codegen/cli']) schemas.push('graphql');
      if (deps['prisma']) schemas.push('prisma');
    }
  }

  // dedupe
  const dedupe = (arr: string[]) => Array.from(new Set(arr));

  return {
    langs: dedupe(langs),
    formatters: dedupe(formatters),
    linters: dedupe(linters),
    typecheckers: dedupe(typecheckers),
    tests: dedupe(tests),
    schemas: dedupe(schemas),
  };
}

// -----------------------------
// Glue: build a brief from index + probe (project-agnostic)
// -----------------------------
export async function buildProjectBrief(root: string) {
  const caps = await capabilitiesProbe(root);
  const index = await lightweightSymbolIndexer(root, { maxFiles: 2000 });

  // pick top identifiers as a crude glossary
  const top = Object.entries(index.identifiers)
    .filter(([k]) => /[A-Za-z]/.test(k))
    .sort((a,b) => b[1]-a[1])
    .slice(0, 200)
    .map(([k]) => k);

  const naming = namingStyleDetector(top);

  // naive layer inference from import paths: group by first-level directory under src/ or top-level
  const edges: Record<string, Record<string, number>> = {};
  for (const im of index.imports) {
    const src = im.from.replace(root+path.sep, '');
    const srcSeg = src.split(/[\\/]/).find(Boolean) || '';
    let toSeg = im.to;
    if (toSeg.startsWith('.')) {
      const abs = path.normalize(path.join(path.dirname(im.from), im.to));
      toSeg = abs.replace(root+path.sep, '').split(/[\\/]/).find(Boolean) || '';
    } else {
      continue; // external dep — skip
    }
    if (!edges[srcSeg]) edges[srcSeg] = {} as Record<string, number>;
    edges[srcSeg][toSeg] = (edges[srcSeg][toSeg] ?? 0) + 1;
  }

  const layers = Object.keys(edges).map(k => ({ name: k }));

  return {
    naming: naming.recommendation,
    glossary: top.slice(0, 100),
    layers,
    capabilities: caps,
  } as const;
}

export default { namingStyleDetector, extractIdentifiers, lightweightSymbolIndexer, capabilitiesProbe, buildProjectBrief };

