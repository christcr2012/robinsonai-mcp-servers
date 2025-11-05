import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import { INCLUDE, EXCLUDE } from './indexer.js';
import { lexicalRank } from './search.js';

export interface QuickSearchHit {
  uri: string;
  snippet: string;
  score: number;
}

const FILE_LIMIT = parseInt(process.env.RCE_QUICK_FILE_LIMIT ?? '320', 10);
const SNIPPET_CHARS = parseInt(process.env.RCE_QUICK_SNIPPET_CHARS ?? '620', 10);
const READ_BYTES = parseInt(process.env.RCE_QUICK_READ_BYTES ?? '120000', 10);

function buildSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const term = query.split(/\s+/)[0]?.toLowerCase() ?? '';
  const idx = term ? lower.indexOf(term) : -1;

  if (idx === -1) {
    return text.slice(0, SNIPPET_CHARS);
  }

  const start = Math.max(0, idx - Math.floor(SNIPPET_CHARS / 2));
  return text.slice(start, start + SNIPPET_CHARS);
}

export async function quickSearchFallback(root: string, query: string, k: number): Promise<QuickSearchHit[]> {
  const files = await fg(INCLUDE, { cwd: root, ignore: EXCLUDE, absolute: true, dot: false });
  const limited = files.slice(0, FILE_LIMIT);
  const scored: QuickSearchHit[] = [];

  for (const file of limited) {
    try {
      const text = fs.readFileSync(file, 'utf8').slice(0, READ_BYTES);
      const score = lexicalRank(query, text);
      if (score <= 0) continue;
      scored.push({
        uri: path.relative(root, file).replace(/\\/g, '/'),
        snippet: buildSnippet(text, query),
        score,
      });
    } catch {
      continue;
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

