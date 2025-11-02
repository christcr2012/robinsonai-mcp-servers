import { loadChunks, loadEmbeddings } from './store.js';
import { cosine } from './embedding.js';
import { Hit } from './types.js';

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
  const chunks = loadChunks();
  const embs = loadEmbeddings();
  
  if (!chunks.length) return [];
  
  // lazy embed for query using same provider as chunks
  const { embedBatch } = await import('./embedding.js');
  const [qvec] = await embedBatch([query]);
  
  const map = new Map(embs.map(e => [e.id, e.vec]));
  
  const scored = chunks.map(c => {
    const v = map.get(c.id);
    let s = v ? cosine(qvec, v) : 0;
    s = 0.80 * s + 0.20 * lexicalRank(query, c.text);
    return { score: s, chunk: c, id: c.id };
  });
  
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

