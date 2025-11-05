import fs from 'fs';
import path from 'path';

import { contextRootPath, loadChunks } from './store.js';
import type { SymbolIndex } from './symbol-index.js';
import type { Chunk } from './types.js';
import type { Candidate } from './rankers/code_first.js';

export interface ArchitecturalPattern {
  name: string;
  files: string[];
  confidence: number;
  keywords: string[];
  lastDetected: string;
}

export interface StylePattern {
  type: 'naming' | 'formatting' | 'import' | 'comment';
  pattern: string;
  frequency: number;
  examples: string[];
}

export interface PatternSnapshot {
  architecture: ArchitecturalPattern[];
  style: StylePattern[];
  learnedAt: string;
}

const PATTERN_PATH = path.join(contextRootPath(), 'patterns.json');

export function loadPatternSnapshot(): PatternSnapshot | null {
  try {
    if (!fs.existsSync(PATTERN_PATH)) return null;
    const raw = fs.readFileSync(PATTERN_PATH, 'utf8');
    return JSON.parse(raw) as PatternSnapshot;
  } catch (error) {
    console.warn('[pattern-store] Failed to load patterns:', error);
    return null;
  }
}

export function savePatternSnapshot(snapshot: PatternSnapshot): void {
  try {
    fs.mkdirSync(path.dirname(PATTERN_PATH), { recursive: true });
    fs.writeFileSync(PATTERN_PATH, JSON.stringify(snapshot, null, 2));
  } catch (error) {
    console.warn('[pattern-store] Failed to save patterns:', error);
  }
}

export function analyzePatterns(symbolIndex: SymbolIndex, importGraph: Array<{ from: string; to: string }> = [], chunks: Chunk[] = loadChunks()): PatternSnapshot {
  const architecture = detectArchitecture(symbolIndex, importGraph);
  const style = detectStyle(symbolIndex, chunks);

  return {
    architecture,
    style,
    learnedAt: new Date().toISOString(),
  };
}

export function applyPatternBoosts(query: string, candidates: Array<Candidate & { score?: number }>, snapshot: PatternSnapshot | null): Array<Candidate & { score?: number }> {
  if (!snapshot) return candidates;

  const loweredQuery = query.toLowerCase();
  const boosted = candidates.map(c => ({ ...c }));

  for (const pattern of snapshot.architecture) {
    const keywordMatch = pattern.keywords.some(k => loweredQuery.includes(k));
    if (!keywordMatch) continue;
    const weight = 0.08 * pattern.confidence;
    for (const cand of boosted) {
      const uriLower = cand.uri.toLowerCase();
      if (pattern.files.some(f => uriLower.includes(f.toLowerCase()))) {
        cand.score = (cand.score ?? 0) + weight;
      }
    }
  }

  for (const stylePattern of snapshot.style) {
    if (stylePattern.type === 'naming') {
      if (/camel|pascal/.test(stylePattern.pattern.toLowerCase()) && /camel|pascal/.test(loweredQuery)) {
        for (const cand of boosted) {
          cand.score = (cand.score ?? 0) + 0.04 * stylePattern.frequency;
        }
      }
      if (/snake/.test(stylePattern.pattern.toLowerCase()) && /snake/.test(loweredQuery)) {
        for (const cand of boosted) {
          cand.score = (cand.score ?? 0) + 0.04 * stylePattern.frequency;
        }
      }
    }
    if (stylePattern.type === 'formatting' && /tab|space/.test(loweredQuery)) {
      for (const cand of boosted) {
        cand.score = (cand.score ?? 0) + 0.02 * stylePattern.frequency;
      }
    }
  }

  boosted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return boosted;
}

function detectArchitecture(symbolIndex: SymbolIndex, importGraph: Array<{ from: string; to: string }>): ArchitecturalPattern[] {
  const files = symbolIndex.files.map(f => f.toLowerCase());
  const patterns: ArchitecturalPattern[] = [];

  const controllers = files.filter(f => f.includes('controller'));
  const services = files.filter(f => f.includes('service'));
  const models = files.filter(f => f.includes('model') || f.includes('entity'));
  const repositories = files.filter(f => f.includes('repository') || f.includes('repo'));
  const hooks = files.filter(f => f.includes('hook.'));
  const widgets = files.filter(f => f.includes('component') || f.includes('view'));

  const total = Math.max(1, files.length);

  if (controllers.length && services.length && models.length) {
    const related = unique([...controllers, ...services, ...models]);
    patterns.push({
      name: 'MVC',
      files: related,
      confidence: Math.min(1, related.length / total),
      keywords: ['controller', 'model', 'view'],
      lastDetected: new Date().toISOString(),
    });
  }

  if (services.length && repositories.length) {
    const related = unique([...services, ...repositories]);
    patterns.push({
      name: 'Service / Repository',
      files: related,
      confidence: Math.min(1, related.length / total),
      keywords: ['service', 'repository', 'data'],
      lastDetected: new Date().toISOString(),
    });
  }

  if (hooks.length || widgets.length) {
    const related = unique([...hooks, ...widgets]);
    patterns.push({
      name: 'Component-Based UI',
      files: related,
      confidence: Math.min(1, related.length / total),
      keywords: ['component', 'hook', 'view'],
      lastDetected: new Date().toISOString(),
    });
  }

  if (importGraph.length > 0) {
    const edgesPerFile = new Map<string, number>();
    for (const edge of importGraph) {
      const key = edge.from.toLowerCase();
      edgesPerFile.set(key, (edgesPerFile.get(key) ?? 0) + 1);
    }
    const hubs = Array.from(edgesPerFile.entries())
      .filter(([, count]) => count > 6)
      .map(([file]) => file);
    if (hubs.length) {
      patterns.push({
        name: 'Hub-and-Spoke Modules',
        files: hubs,
        confidence: Math.min(1, hubs.length / total),
        keywords: ['module', 'core', 'shared'],
        lastDetected: new Date().toISOString(),
      });
    }
  }

  return patterns;
}

function detectStyle(symbolIndex: SymbolIndex, chunks: Chunk[]): StylePattern[] {
  const styles: StylePattern[] = [];
  const names = symbolIndex.symbols.map(s => s.name);

  let camel = 0, snake = 0, pascal = 0;
  for (const name of names) {
    if (/^[a-z]+[A-Za-z0-9]*$/.test(name) && /[A-Z]/.test(name)) camel++;
    if (/[a-z]+_[a-z0-9]+/.test(name)) snake++;
    if (/^[A-Z][A-Za-z0-9]*$/.test(name)) pascal++;
  }
  const totalNames = Math.max(1, names.length);
  const namingConfidence = (count: number) => Math.min(1, count / totalNames);

  if (camel > snake && camel > pascal) {
    styles.push({
      type: 'naming',
      pattern: 'camelCase identifiers',
      frequency: namingConfidence(camel),
      examples: names.filter(n => /[A-Z]/.test(n)).slice(0, 5),
    });
  } else if (pascal > camel && pascal > snake) {
    styles.push({
      type: 'naming',
      pattern: 'PascalCase types',
      frequency: namingConfidence(pascal),
      examples: names.filter(n => /^[A-Z]/.test(n)).slice(0, 5),
    });
  } else if (snake > 0) {
    styles.push({
      type: 'naming',
      pattern: 'snake_case identifiers',
      frequency: namingConfidence(snake),
      examples: names.filter(n => n.includes('_')).slice(0, 5),
    });
  }

  let tabIndents = 0;
  let spaceIndents = 0;
  const sampleLines = chunks
    .flatMap(chunk => chunk.text.split(/\r?\n/).slice(0, 40))
    .slice(0, 400);

  for (const line of sampleLines) {
    if (/^\t+\S/.test(line)) tabIndents++;
    if (/^ {2,}\S/.test(line)) spaceIndents++;
  }
  const indentTotal = Math.max(1, tabIndents + spaceIndents);
  if (tabIndents > spaceIndents) {
    styles.push({
      type: 'formatting',
      pattern: 'Tab-indented code',
      frequency: tabIndents / indentTotal,
      examples: sampleLines.filter(l => /^\t/.test(l)).slice(0, 3),
    });
  } else if (spaceIndents > 0) {
    const avgSpaces = averageIndent(sampleLines);
    styles.push({
      type: 'formatting',
      pattern: `${avgSpaces}-space indentation`,
      frequency: spaceIndents / indentTotal,
      examples: sampleLines.filter(l => /^ {2,}\S/.test(l)).slice(0, 3),
    });
  }

  let singleQuotes = 0;
  let doubleQuotes = 0;
  for (const line of sampleLines) {
    if (/import\s+.*'.*'/.test(line) || /require\('.*'\)/.test(line)) singleQuotes++;
    if (/import\s+.*".*"/.test(line) || /require\(".*"\)/.test(line)) doubleQuotes++;
  }
  const totalQuotes = Math.max(1, singleQuotes + doubleQuotes);
  if (singleQuotes > doubleQuotes) {
    styles.push({
      type: 'import',
      pattern: 'Single-quoted imports',
      frequency: singleQuotes / totalQuotes,
      examples: sampleLines.filter(l => /import\s+.*'.*'/.test(l)).slice(0, 3),
    });
  } else if (doubleQuotes > 0) {
    styles.push({
      type: 'import',
      pattern: 'Double-quoted imports',
      frequency: doubleQuotes / totalQuotes,
      examples: sampleLines.filter(l => /import\s+.*".*"/.test(l)).slice(0, 3),
    });
  }

  return styles;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function averageIndent(lines: string[]): number {
  const indents = lines
    .map(line => line.match(/^( +)\S/)?.[1]?.length ?? 0)
    .filter(len => len > 0);
  if (!indents.length) return 2;
  return Math.round(indents.reduce((sum, len) => sum + len, 0) / indents.length);
}
