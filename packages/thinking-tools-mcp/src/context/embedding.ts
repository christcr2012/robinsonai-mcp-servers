import { request } from 'undici';
import pLimit from 'p-limit';
import crypto from 'crypto';

const prov = (process.env.CTX_EMBED_PROVIDER || 'ollama').toLowerCase();

/**
 * Embed batch of texts using configured provider
 * Supports: ollama (free), openai (paid), claude/voyage (paid)
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  console.log(`[embedBatch] Using provider: ${prov} for ${texts.length} texts`);

  try {
    if (prov === 'openai') return await openaiEmbed(texts);
    if (prov === 'claude' || prov === 'voyage') return await voyageEmbed(texts);
    return await ollamaEmbed(texts);
  } catch (error: any) {
    const message = error?.message ?? String(error);
    console.warn(`⚠️  [embedBatch] Provider "${prov}" failed (${message}). Falling back to lexical embeddings.`);
    return lexicalFallbackEmbed(texts);
  }
}

const FALLBACK_DIMS = parseInt(process.env.CTX_FALLBACK_EMBED_DIMS || '384', 10);
let loggedFallbackInfo = false;

function lexicalFallbackEmbed(texts: string[]): number[][] {
  if (!loggedFallbackInfo) {
    console.warn(`⚠️  [embedBatch] Using deterministic lexical embeddings with ${FALLBACK_DIMS} dimensions.`);
    console.warn('⚠️  [embedBatch] Results rely on lexical/BM25 scoring until a vector provider is available.');
    loggedFallbackInfo = true;
  }

  return texts.map(text => hashedEmbedding(text, FALLBACK_DIMS));
}

function hashedEmbedding(text: string, dims: number): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  if (tokens.length === 0) return vec;

  for (const token of tokens) {
    const digest = crypto.createHash('sha1').update(token).digest();
    const index = ((digest[0] << 8) | digest[1]) % dims;
    const sign = (digest[2] & 1) === 0 ? 1 : -1;
    vec[index] += sign;
  }

  // L2 normalize so cosine similarity behaves well
  let norm = 0;
  for (const v of vec) {
    norm += v * v;
  }
  if (norm > 0) {
    const scale = 1 / Math.sqrt(norm);
    for (let i = 0; i < vec.length; i++) {
      vec[i] *= scale;
    }
  }

  return vec;
}

async function ollamaEmbed(texts: string[]): Promise<number[][]> {
  const url = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434') + '/api/embeddings';
  const model = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  const concurrency = parseInt(process.env.OLLAMA_EMBED_CONCURRENCY || '10', 10);

  const limit = pLimit(concurrency);

  const promises = texts.map((text, index) =>
    limit(async () => {
      const r = await request(url, {
        method: 'POST',
        body: JSON.stringify({ model, prompt: text }),
        headers: { 'content-type': 'application/json' }
      });
      const j: any = await r.body.json();
      if (!j?.embedding) throw new Error(`Ollama embed error for text ${index}`);
      return j.embedding;
    })
  );

  return Promise.all(promises);
}

async function openaiEmbed(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY missing');

  const model = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
  const r = await request('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${key}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ model, input: texts })
  });

  const j: any = await r.body.json();
  return j.data.map((d: any) => d.embedding);
}

async function voyageEmbed(texts: string[]): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('VOYAGE_API_KEY or ANTHROPIC_API_KEY missing');

  const model = process.env.VOYAGE_EMBED_MODEL || 'voyage-code-2';
  const r = await request('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${key}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ model, input: texts, input_type: 'document' })
  });

  const j: any = await r.body.json();
  return j.data.map((d: any) => d.embedding);
}

export function cosine(a: number[], b: number[]): number {
  let s = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return s / (Math.sqrt(na) * Math.sqrt(nb));
}

