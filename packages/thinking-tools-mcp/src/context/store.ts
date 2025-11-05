import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import { gunzipSync, gzipSync } from 'zlib';
import { Chunk, Embedding, IndexStats } from './types.js';
import { resolveWorkspaceRoot } from '../lib/workspace.js';

// Import doc types
export type StoredDoc = import('./docs/types.js').DocRecord;

// Resolve paths relative to workspace root, not process.cwd()
function getContextRoot(): string {
  if (process.env.CTX_ROOT) {
    return path.isAbsolute(process.env.CTX_ROOT)
      ? process.env.CTX_ROOT
      : path.join(resolveWorkspaceRoot(), process.env.CTX_ROOT);
  }
  return path.join(resolveWorkspaceRoot(), '.robinson/context');
}

const root = getContextRoot();

const P = {
  chunks: path.join(root, 'chunks.jsonl'),
  embeds: path.join(root, 'embeddings.jsonl'),
  stats: path.join(root, 'stats.json'),
  docs: path.join(root, 'docs.jsonl'),
  files: path.join(root, 'files.json'),
  embedCache: path.join(root, 'embed-cache'),
  patterns: path.join(root, 'patterns.json')
};

function compressionEnabled(): boolean {
  const flag = process.env.RCE_COMPRESS;
  if (flag === undefined) return false;
  return flag === '1' || flag === 'true';
}

export function ensureDirs() {
  fs.mkdirSync(path.dirname(P.chunks), { recursive: true });
  fs.mkdirSync(P.embedCache, { recursive: true });
  // Ensure files.json exists
  if (!fs.existsSync(P.files)) {
    fs.writeFileSync(P.files, '{}', 'utf8');
  }
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

function maybeCompressChunk(chunk: Chunk): Chunk {
  if (!compressionEnabled() || chunk.compressed) {
    return chunk;
  }

  try {
    const gz = gzipSync(Buffer.from(chunk.text, 'utf8'));
    return {
      ...chunk,
      text: gz.toString('base64'),
      compressed: true,
      encoding: 'gzip'
    };
  } catch (error) {
    console.warn('[store] Failed to compress chunk, storing uncompressed:', (error as Error).message);
    return { ...chunk, compressed: false, encoding: 'none' };
  }
}

export function hydrateChunk(chunk: Chunk): Chunk {
  if (!chunk.compressed) {
    return { ...chunk, encoding: chunk.encoding ?? 'none' };
  }

  if (chunk.encoding && chunk.encoding !== 'gzip') {
    return { ...chunk, compressed: false, encoding: 'none' };
  }

  try {
    const buf = Buffer.from(chunk.text, 'base64');
    const text = gunzipSync(buf).toString('utf8');
    return {
      ...chunk,
      text,
      compressed: false,
      encoding: 'none'
    };
  } catch (error) {
    console.warn('[store] Failed to decompress chunk, returning raw payload:', (error as Error).message);
    return { ...chunk, compressed: false, encoding: 'none' };
  }
}

export function loadChunks(): Chunk[] {
  return Array.from(readJSONL<Chunk>(P.chunks)).map(hydrateChunk);
}

export function loadEmbeddings(): Embedding[] {
  return Array.from(readJSONL<Embedding>(P.embeds));
}

export function saveChunk(c: Chunk) {
  appendJSONL(P.chunks, maybeCompressChunk(c));
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

// Document storage functions
export function saveDocs(docs: StoredDoc[]) {
  for (const d of docs) {
    appendJSONL(P.docs, d);
  }
}

export function loadDocs(): StoredDoc[] {
  return Array.from(readJSONL<StoredDoc>(P.docs));
}

// --- File map (path -> {mtimeMs, size, contentSha, chunkIds[]})
export function loadFileMap(): Record<string, any> {
  try {
    if (!fs.existsSync(P.files)) return {};
    const content = fs.readFileSync(P.files, 'utf8');
    return JSON.parse(content || '{}');
  } catch {
    return {};
  }
}

export function saveFileMap(m: Record<string, any>) {
  fs.writeFileSync(P.files, JSON.stringify(m, null, 2), 'utf8');
}

// --- Delete all chunks for a file (used on modify/delete)
export function deleteChunksForFile(file: string) {
  const all = loadChunks();
  const keep = all
    .filter(c => c.path !== file && c.uri !== file)
    .map(maybeCompressChunk);
  // Rewrite chunks file
  fs.writeFileSync(P.chunks, keep.map(c => JSON.stringify(c)).join('\n') + '\n', 'utf8');
}

// --- Embeddings cache: model|sha -> vector
function cacheKey(model: string, sha: string): string {
  return `${model}|${sha}`;
}

export function getCachedVec(model: string, sha: string): number[] | undefined {
  try {
    const p = path.join(P.embedCache, `${model}.jsonl`);
    if (!fs.existsSync(p)) return undefined;
    const txt = fs.readFileSync(p, 'utf8');
    for (const line of txt.split('\n')) {
      if (!line) continue;
      const [k, payload] = JSON.parse(line);
      if (k === cacheKey(model, sha)) return payload;
    }
  } catch {}
  return undefined;
}

export function putCachedVec(model: string, sha: string, vec: number[]) {
  const p = path.join(P.embedCache, `${model}.jsonl`);
  fs.appendFileSync(p, JSON.stringify([cacheKey(model, sha), vec]) + '\n', 'utf8');
}

export function sha(text: string): string {
  return crypto.createHash('sha1').update(text).digest('hex');
}

export interface PatternStoreData {
  version: number;
  analyzedAt: string;
  symbolCount: number;
  graphEdges: number;
  behavior: any[];
  styles: any[];
  architectures: any[];
}

export function loadPatternStore(): PatternStoreData | null {
  if (!fs.existsSync(P.patterns)) {
    return null;
  }

  try {
    const txt = fs.readFileSync(P.patterns, 'utf8');
    return JSON.parse(txt) as PatternStoreData;
  } catch (error) {
    console.warn('[store] Failed to parse pattern store, resetting:', (error as Error).message);
    return null;
  }
}

export function savePatternStore(data: PatternStoreData): void {
  fs.mkdirSync(path.dirname(P.patterns), { recursive: true });
  fs.writeFileSync(P.patterns, JSON.stringify(data, null, 2), 'utf8');
}

