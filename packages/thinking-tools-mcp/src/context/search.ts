import { readJSONL, getPaths } from './store.js';
import { cosine } from './embedding.js';
import { Hit, Chunk, Embedding } from './types.js';
import { getQueryCache } from './cache.js';

export function lexicalRank(query: string, text: string): number {
  const q = query.toLowerCase().split(/\W+/).filter(Boolean);
  const t = text.toLowerCase();
  let s = 0;

  for (const w of q) {
    const c = t.split(w).length - 1;
    s += c;
  }

  return s;
}

export async function hybridQuery(query: string, topK = 8): Promise<Hit[]> {
  // Check cache first
  const cache = getQueryCache();
  const cached = cache.get(query, topK);
  if (cached) {
    console.log(`[hybridQuery] Cache hit for "${query}"`);
    return cached;
  }

  // Stream chunks and embeddings instead of loading all into memory
  const paths = getPaths();

  // lazy embed for query using same provider as chunks
  const { embedBatch } = await import('./embedding.js');
  const [qvec] = await embedBatch([query]);

  // Build embedding map (stream to avoid memory overflow)
  const embMap = new Map<string, number[]>();
  try {
    for (const emb of readJSONL<Embedding>(paths.embeds)) {
      embMap.set(emb.id, emb.vec);
    }
  } catch (error: any) {
    console.error('[hybridQuery] Error loading embeddings:', error);
  }

  // Stream chunks and score incrementally
  const scored: Hit[] = [];
  try {
    for (const chunk of readJSONL<Chunk>(paths.chunks)) {
      const v = embMap.get(chunk.id);
      let s = v ? cosine(qvec, v) : 0;
      s = 0.80 * s + 0.20 * lexicalRank(query, chunk.text);

      // Attach vector to chunk for reranking
      const chunkWithVec = v ? { ...chunk, vec: v } : chunk;

      scored.push({ score: s, chunk: chunkWithVec, id: chunk.id });
    }
  } catch (error: any) {
    console.error('[hybridQuery] Error loading chunks:', error);
  }

  if (!scored.length) return [];

  const results = scored.sort((a, b) => b.score - a.score).slice(0, topK);

  // Cache the results
  cache.set(query, topK, results);

  return results;
}

