import path from 'node:path';
import type { SymbolIndex } from './symbol-index.js';
import type { ArchitecturalPattern as StoredPattern } from './memory/types.js';
import { BehaviorMemory } from './memory/behavior.js';

type ImportEdge = { from: string; to: string };

type PatternSummary = {
  id: string;
  name: string;
  description: string;
  files: string[];
  confidence: number;
  tags: string[];
};

type Hit = { uri: string; score: number; meta?: Record<string, any> };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalize(root: string, file: string | undefined): string {
  if (!file) return '';
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  return path.relative(root, abs).replace(/\\/g, '/');
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function detectPatterns(root: string, symbolIndex: SymbolIndex | null, importGraph: ImportEdge[] | null): PatternSummary[] {
  const fileCandidates = uniq([
    ...(symbolIndex?.files ?? []).map(f => normalize(root, f)),
    ...(symbolIndex?.symbols ?? []).map(sym => normalize(root, sym.file)),
  ]);

  const controllers = fileCandidates.filter(f => /(^|\/)controllers?\//.test(f));
  const services = fileCandidates.filter(f => /(^|\/)services?\//.test(f));
  const repositories = fileCandidates.filter(f => /(^|\/)repositor(y|ies)\//.test(f));

  const components = fileCandidates.filter(f => /(^|\/)components?\//.test(f));
  const hooks = fileCandidates.filter(f => /(^|\/)hooks?\//.test(f));

  const domain = fileCandidates.filter(f => /(^|\/)domain\//.test(f));
  const application = fileCandidates.filter(f => /(^|\/)application\//.test(f));
  const infrastructure = fileCandidates.filter(f => /(^|\/)infrastructure\//.test(f));

  const mcp = fileCandidates.filter(f => f.startsWith('packages/mcp/'));
  const contextEngine = fileCandidates.filter(f => /context(engine|indexer)/i.test(f));

  const total = Math.max(1, fileCandidates.length);
  const patterns: PatternSummary[] = [];

  if (controllers.length && services.length) {
    const files = uniq([...controllers, ...services, ...repositories]);
    const edgeHits = (importGraph ?? []).filter(edge =>
      /controller/.test(edge.from.toLowerCase()) && /service/.test(edge.to.toLowerCase())
    );
    const confidence = clamp((files.length + edgeHits.length) / (total * 0.6));
    patterns.push({
      id: 'layered-services',
      name: 'Layered Services',
      description: 'Controllers delegate to dedicated service and repository layers.',
      files,
      confidence,
      tags: ['controller', 'service', 'repository'],
    });
  }

  if (components.length || hooks.length) {
    const files = uniq([...components, ...hooks]);
    const confidence = clamp(files.length / (total * 0.5));
    patterns.push({
      id: 'react-component-system',
      name: 'React Component System',
      description: 'UI organized around reusable components and hooks.',
      files,
      confidence,
      tags: ['component', 'ui', 'hooks'],
    });
  }

  if (domain.length || application.length || infrastructure.length) {
    const files = uniq([...domain, ...application, ...infrastructure]);
    const confidence = clamp(files.length / (total * 0.5));
    patterns.push({
      id: 'domain-driven-design',
      name: 'Domain-Driven Design',
      description: 'Domain/application/infrastructure layers detected (DDD style).',
      files,
      confidence,
      tags: ['domain', 'application', 'infrastructure'],
    });
  }

  if (mcp.length) {
    patterns.push({
      id: 'mcp-server-bundle',
      name: 'MCP Server Bundle',
      description: 'Custom MCP package(s) present in the monorepo.',
      files: mcp,
      confidence: clamp(mcp.length / 5),
      tags: ['monorepo', 'mcp'],
    });
  }

  if (contextEngine.length) {
    patterns.push({
      id: 'context-engine-core',
      name: 'Context Engine Core',
      description: 'Core context engine modules (ContextEngine, indexer, watcher) detected.',
      files: contextEngine,
      confidence: clamp(contextEngine.length / 4),
      tags: ['context-engine'],
    });
  }

  return patterns;
}

export class ArchitectureMemory {
  private readonly behavior: BehaviorMemory;
  private patterns: PatternSummary[] = [];

  constructor(private readonly root: string) {
    this.behavior = BehaviorMemory.forRoot(root);
    const stored = this.behavior.getArchitecture();
    if (stored.length) {
      this.patterns = stored.map(pattern => ({
        id: slugify(pattern.name),
        name: pattern.name,
        description: pattern.description,
        files: pattern.files,
        confidence: clamp(pattern.confidence),
        tags: pattern.tags ?? [],
      }));
    }
  }

  async refresh(symbolIndex: SymbolIndex | null, importGraph: ImportEdge[] | null): Promise<void> {
    this.patterns = detectPatterns(this.root, symbolIndex, importGraph);
    const stored: StoredPattern[] = this.patterns.map(pattern => ({
      name: pattern.name,
      description: pattern.description,
      files: pattern.files,
      confidence: clamp(pattern.confidence),
      tags: pattern.tags,
      detectedAt: new Date().toISOString(),
    }));
    this.behavior.updateArchitecture(stored);
  }

  summary(): { root: string; total: number; patterns: PatternSummary[] } {
    return {
      root: this.root,
      total: this.patterns.length,
      patterns: this.patterns.map(pattern => ({
        ...pattern,
        id: pattern.id || slugify(pattern.name),
      })),
    };
  }

  annotateResults(query: string, hits: Hit[]): Hit[] {
    if (!Array.isArray(hits) || hits.length === 0) {
      return hits ?? [];
    }

    return hits.map(hit => {
      const boost = this.behavior.architectureBoost(hit.uri);
      const tags = boost.tags.map(tag => ({
        id: slugify(tag),
        name: tag,
        weight: Number(boost.score.toFixed(3)),
      }));

      const meta = {
        ...(hit.meta ?? {}),
        architecture: tags,
      };

      const boostedScore = (typeof hit.score === 'number' ? hit.score : 0) + boost.score;
      return { ...hit, score: boostedScore, meta };
    });
  }
}
