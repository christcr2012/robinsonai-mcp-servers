import fs from 'fs';
import path from 'path';
import { loadPatternStore, savePatternStore } from './store.js';
import type { SymbolIndex, Symbol } from './symbol-index.js';

export interface BehaviorPattern {
  type: 'import' | 'naming' | 'layer';
  pattern: string;
  score: number;
  examples: string[];
}

export interface StylePattern {
  type: 'naming' | 'formatting' | 'language';
  description: string;
  regex?: string;
  weight: number;
}

export interface ArchitecturalPattern {
  name: string;
  summary: string;
  files: string[];
  confidence: number;
}

interface AnalysisResult {
  behavior: BehaviorPattern[];
  styles: StylePattern[];
  architectures: ArchitecturalPattern[];
}

const MAX_IMPORT_FILES = 400;
const MAX_SAMPLE_LINES = 400;

function normalizePath(root: string, file: string): string {
  return path.relative(root, file).replace(/\\/g, '/');
}

function analyseNaming(symbols: Symbol[]): StylePattern[] {
  if (!symbols.length) return [];

  const names = symbols.map(s => s.name);
  const total = names.length;

  const camel = names.filter(n => /^[a-z]+(?:[A-Z][a-z0-9]+)+$/.test(n)).length;
  const snake = names.filter(n => /^[a-z]+(?:_[a-z0-9]+)+$/.test(n)).length;
  const pascal = names.filter(n => /^[A-Z][A-Za-z0-9]+$/.test(n)).length;

  const patterns: StylePattern[] = [];

  if (camel / total > 0.2) {
    patterns.push({
      type: 'naming',
      description: 'Project prefers camelCase identifiers',
      regex: '[a-z]+(?:[A-Z][a-z0-9]+)+',
      weight: camel / total,
    });
  }

  if (snake / total > 0.1) {
    patterns.push({
      type: 'naming',
      description: 'Project frequently uses snake_case identifiers',
      regex: '[a-z]+(?:_[a-z0-9]+)+',
      weight: snake / total,
    });
  }

  if (pascal / total > 0.1) {
    patterns.push({
      type: 'naming',
      description: 'Types and classes use PascalCase',
      regex: '[A-Z][A-Za-z0-9]+',
      weight: pascal / total,
    });
  }

  return patterns;
}

function analyseLanguages(files: string[]): StylePattern[] {
  if (!files.length) return [];

  const counts = new Map<string, number>();
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    counts.set(ext, (counts.get(ext) || 0) + 1);
  }

  const total = files.length;
  const styles: StylePattern[] = [];

  for (const [ext, count] of counts.entries()) {
    const weight = count / total;
    if (weight < 0.05) continue;
    styles.push({
      type: 'language',
      description: `Significant ${ext.replace('.', '').toUpperCase()} presence`,
      weight,
    });
  }

  return styles;
}

function analyseImports(files: string[], root: string): BehaviorPattern[] {
  const modules = new Map<string, { count: number; examples: string[] }>();
  const limited = files.slice(0, MAX_IMPORT_FILES);

  for (const abs of limited) {
    let text = '';
    try {
      text = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }

    const snippet = text.split(/\r?\n/).slice(0, MAX_SAMPLE_LINES).join('\n');
    const rel = normalizePath(root, abs);

    const importRegexes = [
      /import[^'"`]*['"]([^'"`]+)['"]/g,
      /require\(['"]([^'"`]+)['"]\)/g,
      /from\s+([\w\.\-_/]+)\s+import/g,
      /use\s+([^;]+);/g,
      /import\s+([^;]+);/g,
    ];

    for (const regex of importRegexes) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(snippet)) !== null) {
        const mod = match[1]?.trim();
        if (!mod) continue;
        const entry = modules.get(mod) || { count: 0, examples: [] };
        entry.count += 1;
        if (entry.examples.length < 5) {
          entry.examples.push(rel);
        }
        modules.set(mod, entry);
      }
    }
  }

  const sorted = Array.from(modules.entries())
    .filter(([, info]) => info.count > 1)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12);

  const totalCount = sorted.reduce((sum, [, info]) => sum + info.count, 0) || 1;

  return sorted.map(([pattern, info]) => ({
    type: 'import' as const,
    pattern,
    score: info.count / totalCount,
    examples: info.examples,
  }));
}

function analyseArchitecture(files: string[], graph: Array<{ from: string; to: string }>, root: string): ArchitecturalPattern[] {
  if (!files.length) return [];

  const normalized = files.map(f => normalizePath(root, f));
  const lower = normalized.map(f => f.toLowerCase());

  const match = (needle: RegExp) => lower.filter(f => needle.test(f));

  const controllers = match(/controller/);
  const services = match(/service/);
  const models = match(/model/);
  const views = match(/view/);
  const repositories = match(/repository/);
  const useCases = match(/use-?case|interactor/);
  const domains = match(/domain/);
  const adapters = match(/adapter/);
  const infra = match(/infra/);

  const patterns: ArchitecturalPattern[] = [];

  const mvcConfidence = (controllers.length + models.length + views.length) / (normalized.length || 1);
  if (mvcConfidence > 0.05) {
    patterns.push({
      name: 'MVC',
      summary: 'Detected controllers, models and views suggesting MVC layering',
      files: [...controllers, ...models, ...views].slice(0, 40),
      confidence: Math.min(1, mvcConfidence * 4),
    });
  }

  const cleanConfidence = (useCases.length + repositories.length + domains.length) / (normalized.length || 1);
  if (cleanConfidence > 0.05) {
    patterns.push({
      name: 'Clean Architecture',
      summary: 'Use cases, repositories and domain modules detected',
      files: [...useCases, ...repositories, ...domains].slice(0, 40),
      confidence: Math.min(1, cleanConfidence * 3),
    });
  }

  const hexConfidence = (domains.length + adapters.length + infra.length) / (normalized.length || 1);
  if (hexConfidence > 0.05) {
    patterns.push({
      name: 'Hexagonal Architecture',
      summary: 'Domain, adapter and infrastructure layers present',
      files: [...domains, ...adapters, ...infra].slice(0, 40),
      confidence: Math.min(1, hexConfidence * 3),
    });
  }

  if (!patterns.length && graph.length > 0) {
    const fanOut: Record<string, number> = {};
    for (const edge of graph) {
      fanOut[edge.from] = (fanOut[edge.from] || 0) + 1;
    }
    const hubs = Object.entries(fanOut)
      .filter(([, edges]) => edges > 8)
      .map(([file]) => normalizePath(root, file));
    if (hubs.length) {
      patterns.push({
        name: 'Hub-and-spoke',
        summary: 'Files with very high fan-out detected – consider modularisation',
        files: hubs.slice(0, 40),
        confidence: Math.min(1, hubs.length / normalized.length),
      });
    }
  }

  return patterns;
}

async function analysePatterns(root: string, symbolIndex: SymbolIndex, graph: Array<{ from: string; to: string }>): Promise<AnalysisResult> {
  const behavior = analyseImports(symbolIndex.files, root);
  const styles = [...analyseNaming(symbolIndex.symbols), ...analyseLanguages(symbolIndex.files)];
  const architectures = analyseArchitecture(symbolIndex.files, graph, root);
  return { behavior, styles, architectures };
}

export class PatternManager {
  private static cache = new Map<string, PatternManager>();
  private data = loadPatternStore();

  private constructor(private root: string) {}

  static forRoot(root: string): PatternManager {
    if (!this.cache.has(root)) {
      this.cache.set(root, new PatternManager(root));
    }
    return this.cache.get(root)!;
  }

  get summary(): AnalysisResult {
    return {
      behavior: this.data?.behavior ?? [],
      styles: this.data?.styles ?? [],
      architectures: this.data?.architectures ?? [],
    };
  }

  async ensureAnalysed(symbolIndex: SymbolIndex, graph: Array<{ from: string; to: string }>): Promise<void> {
    const symbolCount = symbolIndex.symbols.length;
    const graphEdges = graph.length;

    const needsRefresh =
      !this.data ||
      this.data.version !== 1 ||
      this.data.symbolCount !== symbolCount ||
      this.data.graphEdges !== graphEdges;

    if (!needsRefresh) {
      return;
    }

    const analysis = await analysePatterns(this.root, symbolIndex, graph);
    this.data = {
      version: 1,
      analyzedAt: new Date().toISOString(),
      symbolCount,
      graphEdges,
      behavior: analysis.behavior,
      styles: analysis.styles,
      architectures: analysis.architectures,
    };

    savePatternStore(this.data);
  }

  applyBoosts(query: string, candidates: Array<{ uri: string; text: string }>): Map<string, number> {
    const boosts = new Map<string, number>();
    if (!this.data) return boosts;

    const q = query.toLowerCase();

    for (const pattern of this.data.behavior ?? []) {
      if (pattern.type === 'import') {
        const needle = pattern.pattern.toLowerCase();
        if (!q.includes(needle)) continue;
        for (const candidate of candidates) {
          if (candidate.text.toLowerCase().includes(needle)) {
            boosts.set(candidate.uri, (boosts.get(candidate.uri) || 0) + 0.05 + pattern.score * 0.1);
          }
        }
      }
    }

    for (const style of this.data.styles ?? []) {
      if (style.type === 'naming' && style.regex) {
        const regex = new RegExp(style.regex);
        for (const candidate of candidates) {
          const matches = candidate.text.match(regex)?.length ?? 0;
          if (matches > 2) {
            boosts.set(candidate.uri, (boosts.get(candidate.uri) || 0) + Math.min(0.15, style.weight * 0.2));
          }
        }
      }
    }

    for (const arch of this.data.architectures ?? []) {
      const relevant =
        (arch.name === 'MVC' && /(controller|model|view)/.test(q)) ||
        (arch.name === 'Clean Architecture' && /(use case|repository|domain)/.test(q)) ||
        (arch.name === 'Hexagonal Architecture' && /(adapter|port|infrastructure|domain)/.test(q));

      if (!relevant) continue;

      for (const candidate of candidates) {
        const hit = arch.files.some((f: string) => candidate.uri.endsWith(f) || candidate.uri.includes(f));
        if (hit) {
          boosts.set(candidate.uri, (boosts.get(candidate.uri) || 0) + Math.min(0.25, arch.confidence * 0.4));
        }
      }
    }

    return boosts;
  }
}

