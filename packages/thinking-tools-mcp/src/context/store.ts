import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';
import { Chunk, Embedding, IndexStats } from './types.js';
import { resolveWorkspaceRoot } from '../lib/workspace.js';

// Import doc types
export type StoredDoc = import('./docs/types.js').DocRecord;

// Resolve paths relative to workspace root, not process.cwd()
function resolveContextRootPath(): string {
  if (process.env.CTX_ROOT) {
    return path.isAbsolute(process.env.CTX_ROOT)
      ? process.env.CTX_ROOT
      : path.join(resolveWorkspaceRoot(), process.env.CTX_ROOT);
  }
  return path.join(resolveWorkspaceRoot(), '.robinson/context');
}

const root = resolveContextRootPath();

export function getContextRoot(): string {
  return root;
}

const P = {
  chunks: path.join(root, 'chunks.jsonl'),
  embeds: path.join(root, 'embeddings.jsonl'),
  stats: path.join(root, 'stats.json'),
  docs: path.join(root, 'docs.jsonl'),
  files: path.join(root, 'files.json'),
  embedCache: path.join(root, 'embed-cache')
};

const compressionMode = (process.env.RCE_COMPRESSION ?? 'auto').toLowerCase();
const compressionThreshold = parseInt(process.env.RCE_COMPRESSION_THRESHOLD ?? '4096', 10);

function shouldCompressChunks(): boolean {
  if (compressionMode === 'auto') return true;
  return compressionMode === 'on' || compressionMode === 'true' || compressionMode === '1';
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

export function loadChunks(): Chunk[] {
  return Array.from(iterateChunks());
}

export function loadEmbeddings(): Embedding[] {
  return Array.from(readJSONL<Embedding>(P.embeds));
}

export function saveChunk(c: Chunk) {
  appendJSONL(P.chunks, serializeChunk(c));
}

export function saveEmbedding(e: Embedding) {
  appendJSONL(P.embeds, e);
}

export function deleteEmbeddingsById(ids: Set<string>) {
  if (ids.size === 0) return;
  if (!fs.existsSync(P.embeds)) return;

  const remaining: Embedding[] = [];
  for (const embedding of readJSONL<Embedding>(P.embeds)) {
    if (!ids.has(embedding.id)) {
      remaining.push(embedding);
    }
  }

  const payload = remaining.map(e => JSON.stringify(e)).join('\n');
  fs.writeFileSync(P.embeds, payload ? payload + '\n' : '', 'utf8');
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

function countJsonlLines(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content) return 0;
  return content.split(/\r?\n/).filter(Boolean).length;
}

export function recomputeStats(partial: Partial<IndexStats> = {}): IndexStats {
  const prev = getStats();
  const now = new Date().toISOString();

  const chunkCount = countJsonlLines(P.chunks);
  const embedCount = countJsonlLines(P.embeds);

  const base: IndexStats = {
    chunks: chunkCount,
    embeddings: embedCount,
    vectors: embedCount,
    sources: prev?.sources ?? {},
    mode: prev?.mode ?? 'unknown',
    model: prev?.model ?? 'unknown',
    dimensions: prev?.dimensions ?? 0,
    totalCost: prev?.totalCost ?? 0,
    indexedAt: prev?.indexedAt ?? prev?.updatedAt ?? now,
    updatedAt: now,
  };

  const next: IndexStats = { ...base, ...partial };
  next.vectors = typeof next.embeddings === 'number' ? next.embeddings : Number(next.embeddings || 0);
  saveStats(next);
  return next;
}

type SerializedChunk = Omit<Chunk, 'text'> & {
  text: string;
};

function serializeChunk(chunk: Chunk): SerializedChunk {
  if (!shouldCompressChunks()) {
    return { ...chunk };
  }

  const text = chunk.text ?? '';
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes < compressionThreshold) {
    return { ...chunk };
  }

  try {
    const compressed = gzipSync(text);
    return {
      ...chunk,
      text: compressed.toString('base64'),
      compressed: true,
      compressedSize: compressed.length,
      originalSize: bytes,
    };
  } catch (error) {
    console.warn('[serializeChunk] Compression failed, writing plain text:', (error as Error).message);
    return { ...chunk };
  }
}

function hydrateChunk(raw: any): Chunk {
  if (!raw) return raw;

  if (raw.compressed && typeof raw.text === 'string') {
    try {
      const buffer = Buffer.from(raw.text, 'base64');
      const text = gunzipSync(buffer).toString('utf8');
      return {
        ...raw,
        text,
        compressed: true,
        compressedSize: raw.compressedSize ?? buffer.length,
        originalSize: raw.originalSize ?? Buffer.byteLength(text, 'utf8'),
      };
    } catch (error) {
      console.warn('[hydrateChunk] Failed to decompress chunk, returning raw text:', (error as Error).message);
      return {
        ...raw,
        text: raw.text,
        compressed: false,
        compressedSize: undefined,
        originalSize: Buffer.byteLength(String(raw.text ?? ''), 'utf8'),
      };
    }
  }

  return {
    ...raw,
    compressed: !!raw.compressed,
    compressedSize: raw.compressedSize,
    originalSize: raw.originalSize ?? Buffer.byteLength(String(raw.text ?? ''), 'utf8'),
  };
}

export function* iterateChunks(): Generator<Chunk> {
  for (const raw of readJSONL<any>(P.chunks)) {
    yield hydrateChunk(raw);
  }
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
  const keep = all.filter(c => c.path !== file && c.uri !== file);
  // Rewrite chunks file
  const serialized = keep.map(c => JSON.stringify(serializeChunk(c))).join('\n');
  fs.writeFileSync(P.chunks, serialized ? serialized + '\n' : '', 'utf8');
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

function safeStat(p: string): fs.Stats | null {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function dirSize(p: string): number {
  const stat = safeStat(p);
  if (!stat) return 0;
  if (stat.isFile()) return stat.size;

  let total = 0;
  try {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const entry of entries) {
      const child = path.join(p, entry.name);
      total += dirSize(child);
    }
  } catch {}
  return total;
}

export function estimateDiskUsage(): number {
  return dirSize(root);
}

function cleanupEmbedCache(budgetBytes: number): number {
  if (!fs.existsSync(P.embedCache)) return 0;
  let freed = 0;
  try {
    const entries = fs.readdirSync(P.embedCache).map(name => {
      const full = path.join(P.embedCache, name);
      const stat = safeStat(full);
      return stat ? { name, full, mtime: stat.mtimeMs, size: stat.size } : null;
    }).filter(Boolean) as Array<{ name: string; full: string; mtime: number; size: number }>;

    entries.sort((a, b) => a.mtime - b.mtime);

    for (const entry of entries) {
      if (estimateDiskUsage() <= budgetBytes) break;
      try {
        fs.unlinkSync(entry.full);
        freed += entry.size;
      } catch {}
    }
  } catch (error) {
    console.warn('[storage] Failed to clean embed cache:', (error as Error).message);
  }
  return freed;
}

function pruneDocsIfNeeded(budgetBytes: number): number {
  if (!fs.existsSync(P.docs)) return 0;
  const usage = estimateDiskUsage();
  if (usage <= budgetBytes) return 0;

  let freed = 0;
  try {
    const docs = Array.from(readJSONL<any>(P.docs));
    if (docs.length < 50) return 0;
    const trimmed = docs.slice(Math.floor(docs.length / 2));
    fs.writeFileSync(P.docs, trimmed.map(d => JSON.stringify(d)).join('\n') + '\n', 'utf8');
    freed = usage - estimateDiskUsage();
  } catch (error) {
    console.warn('[storage] Failed to prune docs cache:', (error as Error).message);
  }
  return freed;
}

export function applyStoragePolicy(): { usage: number; budgetMb: number; reclaimed: number } {
  const budgetMb = Number(process.env.RCE_MAX_DISK_MB ?? '512');
  if (budgetMb <= 0) {
    return { usage: estimateDiskUsage(), budgetMb, reclaimed: 0 };
  }

  const budgetBytes = budgetMb * 1024 * 1024;
  let usage = estimateDiskUsage();
  let reclaimed = 0;

  if (usage > budgetBytes) {
    reclaimed += cleanupEmbedCache(budgetBytes);
    usage = estimateDiskUsage();
  }

  if (usage > budgetBytes) {
    reclaimed += pruneDocsIfNeeded(budgetBytes);
    usage = estimateDiskUsage();
  }

  return { usage, budgetMb, reclaimed };
}

