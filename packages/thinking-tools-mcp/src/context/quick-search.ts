import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import { lexicalRank } from './search.js';

export interface QuickHit {
  uri: string;
  title: string;
  snippet: string;
  score: number;
  source: 'quick';
}

const FILE_GLOB = ['**/*.{ts,tsx,js,jsx,py,go,java,rs,cpp,c,h,cs,rb,php}'];
const FILE_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/vendor/**',
  '**/.venv*/**',
  '**/venv/**',
  '**/__pycache__/**',
  '**/.idea/**',
];

function highlight(text: string, term: string): string {
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) {
    return text.slice(0, 320);
  }
  const start = Math.max(0, idx - 120);
  const end = Math.min(text.length, idx + term.length + 180);
  return text.slice(start, end);
}

export class QuickSearch {
  private files: string[] = [];
  private lastIndexed = 0;
  private readonly ttlMs = 5 * 60 * 1000;
  private readonly maxFiles = parseInt(process.env.RCE_QUICK_MAX_FILES ?? '400', 10);

  constructor(private readonly root: string) {}

  private async refreshIfNeeded(): Promise<void> {
    const now = Date.now();
    if (this.files.length && now - this.lastIndexed < this.ttlMs) {
      return;
    }

    try {
      const matches = await fg(FILE_GLOB, {
        cwd: this.root,
        ignore: FILE_IGNORE,
        absolute: true,
        dot: false,
      });
      this.files = matches.slice(0, this.maxFiles);
      this.lastIndexed = now;
    } catch (error) {
      console.warn('[QuickSearch] Failed to refresh file list:', (error as Error).message);
    }
  }

  async search(query: string, limit: number): Promise<QuickHit[]> {
    const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (!terms.length) return [];

    await this.refreshIfNeeded();
    if (!this.files.length) return [];

    const prioritized = this.files
      .filter(f => terms.some(term => f.toLowerCase().includes(term)))
      .concat(this.files)
      .slice(0, Math.min(this.maxFiles, 200));

    const seen = new Set<string>();
    const hits: QuickHit[] = [];

    for (const file of prioritized) {
      const rel = path.relative(this.root, file).split(path.sep).join('/');
      if (seen.has(rel)) continue;
      seen.add(rel);

      try {
        const text = await fs.readFile(file, 'utf8');
        const snippet = highlight(text, terms[0]);
        const score = lexicalRank(query, text.slice(0, 16000));
        if (score <= 0) continue;
        hits.push({
          uri: rel,
          title: path.basename(rel),
          snippet,
          score,
          source: 'quick',
        });
      } catch {
        // ignore unreadable files
      }

      if (hits.length >= limit * 2) break;
    }

    return hits
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(hit => ({ ...hit, score: Math.max(0.05, hit.score) }));
  }
}
