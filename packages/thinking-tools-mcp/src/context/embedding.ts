import { request } from 'undici';

const prov = (process.env.CTX_EMBED_PROVIDER || 'ollama').toLowerCase();

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (prov === 'openai') return openaiEmbed(texts);
  return ollamaEmbed(texts);
}

async function ollamaEmbed(texts: string[]): Promise<number[][]> {
  const url = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434') + '/api/embeddings';
  const model = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  const out: number[][] = [];
  
  for (const t of texts) {
    const r = await request(url, {
      method: 'POST',
      body: JSON.stringify({ model, prompt: t }),
      headers: { 'content-type': 'application/json' }
    });
    const j: any = await r.body.json();
    if (!j?.embedding) throw new Error('Ollama embed error');
    out.push(j.embedding);
  }
  
  return out;
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

export function cosine(a: number[], b: number[]): number {
  let s = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return s / (Math.sqrt(na) * Math.sqrt(nb));
}

