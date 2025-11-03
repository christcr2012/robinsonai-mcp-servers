import fs from 'fs';
import path from 'path';
import { Chunk, Embedding, IndexStats } from './types.js';

const root = process.env.CTX_ROOT || '.robinson/context';

const P = {
  chunks: path.join(root, 'chunks.jsonl'),
  embeds: path.join(root, 'embeddings.jsonl'),
  stats: path.join(root, 'stats.json')
};

export function ensureDirs() {
  fs.mkdirSync(path.dirname(P.chunks), { recursive: true });
}

export function* readJSONL<T = any>(p: string): Generator<T> {
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    yield JSON.parse(line) as T;
  }
}

export function appendJSONL(p: string, obj: any) {
  fs.appendFileSync(p, JSON.stringify(obj) + '\n');
}

export function writeJSON(p: string, obj: any) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

export function loadChunks(): Chunk[] {
  return Array.from(readJSONL<Chunk>(P.chunks));
}

export function loadEmbeddings(): Embedding[] {
  return Array.from(readJSONL<Embedding>(P.embeds));
}

export function saveChunk(c: Chunk) {
  appendJSONL(P.chunks, c);
}

export function saveEmbedding(e: Embedding) {
  appendJSONL(P.embeds, e);
}

export function saveStats(s: IndexStats) {
  writeJSON(P.stats, s);
}

export function getStats(): IndexStats | null {
  if (!fs.existsSync(P.stats)) return null;
  try {
    const content = fs.readFileSync(P.stats, 'utf8');
    return JSON.parse(content) as IndexStats;
  } catch (error) {
    console.error('[getStats] Error reading stats:', error);
    return null;
  }
}

export function getPaths() {
  return P;
}

