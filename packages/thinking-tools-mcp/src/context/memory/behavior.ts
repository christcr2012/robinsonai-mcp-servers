import path from 'path';
import { ArchitecturalPattern, StyleMemory } from './types.js';
import { MemoryStore } from './store.js';

const CAMEL_CASE = /[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*/;
const SNAKE_CASE = /[a-z0-9]+_[a-z0-9]+/;
const PASCAL_CASE = /[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*/;

function normalizeFile(root: string, file: string): string {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  const rel = path.relative(root, abs);
  return rel.split(path.sep).join('/').toLowerCase();
}

export class BehaviorMemory {
  private static cache = new Map<string, BehaviorMemory>();

  static forRoot(root: string): BehaviorMemory {
    const key = path.resolve(root);
    if (!this.cache.has(key)) {
      this.cache.set(key, new BehaviorMemory(root));
    }
    return this.cache.get(key)!;
  }

  private readonly store: MemoryStore;

  private constructor(private readonly workspaceRoot: string) {
    this.store = MemoryStore.forRoot(workspaceRoot);
  }

  getStyle(): StyleMemory | null {
    return this.store.getStyle();
  }

  updateStyle(style: StyleMemory | null): void {
    this.store.setStyle(style);
  }

  getArchitecture(): ArchitecturalPattern[] {
    return this.store.getArchitecture();
  }

  updateArchitecture(patterns: ArchitecturalPattern[]): void {
    this.store.setArchitecture(patterns);
  }

  recordUsage(file: string): void {
    this.store.incrementUsage(normalizeFile(this.workspaceRoot, file));
  }

  usageBoost(file: string): number {
    const record = this.store.getUsage(normalizeFile(this.workspaceRoot, file));
    if (!record) return 0;
    return Math.min(0.5, Math.log1p(record.count) / 4);
  }

  architectureBoost(file: string): { score: number; tags: string[] } {
    const norm = normalizeFile(this.workspaceRoot, file);
    const patterns = this.store.getArchitecture();
    if (!patterns.length) {
      return { score: 0, tags: [] };
    }

    let score = 0;
    const tags = new Set<string>();

    for (const pattern of patterns) {
      const matches = pattern.files.some(f => normalizeFile(this.workspaceRoot, f) === norm);
      const partial = pattern.files.some(f => norm.startsWith(normalizeFile(this.workspaceRoot, f)));
      if (matches || partial) {
        score += pattern.confidence * (matches ? 0.9 : 0.6);
        tags.add(pattern.name);
      }
    }

    return { score: Math.min(1, score), tags: Array.from(tags) };
  }

  styleBoost(snippet: string): number {
    const style = this.store.getStyle();
    if (!style) return 0;

    const text = snippet ?? '';
    let score = 0;

    if (style.namingPreference === 'camelCase' && CAMEL_CASE.test(text)) {
      score += 0.6 * style.namingConfidence;
    } else if (style.namingPreference === 'snake_case' && SNAKE_CASE.test(text)) {
      score += 0.6 * style.namingConfidence;
    } else if (style.namingPreference === 'pascalCase' && PASCAL_CASE.test(text)) {
      score += 0.6 * style.namingConfidence;
    } else if (style.namingPreference === 'kebab-case' && text.includes('-')) {
      score += 0.4 * style.namingConfidence;
    }

    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (style.indentStyle === 'spaces') {
      const spaces = lines.filter(l => /^ +\S/.test(l)).length;
      if (spaces > 0) {
        const ratio = spaces / lines.length;
        score += 0.2 * Math.min(1, ratio);
      }
      if (style.indentSize) {
        const exact = lines.filter(l => new RegExp(`^ {${style.indentSize}}`).test(l)).length;
        if (exact > 0) {
          score += 0.1 * Math.min(1, exact / lines.length);
        }
      }
    } else if (style.indentStyle === 'tabs') {
      const tabs = lines.filter(l => /^\t+\S/.test(l)).length;
      if (tabs > 0) {
        score += 0.25 * Math.min(1, tabs / lines.length);
      }
    }

    if (style.quoteStyle === 'single') {
      const singles = (text.match(/'/g) || []).length;
      const doubles = (text.match(/"/g) || []).length;
      if (singles > doubles) score += 0.1;
    } else if (style.quoteStyle === 'double') {
      const singles = (text.match(/'/g) || []).length;
      const doubles = (text.match(/"/g) || []).length;
      if (doubles >= singles) score += 0.1;
    }

    return Math.min(1, score);
  }
}
