import { request } from 'undici';
import pLimit from 'p-limit';

const prov = (process.env.CTX_EMBED_PROVIDER || 'ollama').toLowerCase();

/**
 * Embed batch of texts using configured provider
 * Supports: ollama (free), openai (paid), claude/voyage (paid)
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  console.log(`[embedBatch] Using provider: ${prov} for ${texts.length} texts`);

  if (prov === 'openai') return openaiEmbed(texts);
  if (prov === 'claude' || prov === 'voyage') return voyageEmbed(texts);
  return ollamaEmbed(texts);
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

