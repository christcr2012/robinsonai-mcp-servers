import { request } from 'undici';
import pLimit from 'p-limit';
import crypto from 'crypto';
import path from 'path';

export type ContentType = 'code' | 'docs' | 'finance' | 'legal' | 'general';
export type InputType = 'query' | 'document';

export interface EmbedOptions {
  contentType?: ContentType;
  inputType?: InputType;
  filePath?: string;
  provider?: 'voyage' | 'openai' | 'ollama' | 'auto';
}

/**
 * Detect content type from file path and content
 */
export function detectContentType(filePath: string, content: string = ''): ContentType {
  const ext = path.extname(filePath).toLowerCase();

  // Code files
  const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs', '.cpp', '.c', '.h', '.sql', '.sh', '.ps1'];
  if (codeExts.includes(ext)) return 'code';

  // Documentation files
  const docExts = ['.md', '.mdx', '.txt', '.rst'];
  if (docExts.includes(ext)) {
    const lowerContent = content.toLowerCase();
    // Check for legal keywords
    if (/\b(gdpr|hipaa|pci|sox|compliance|regulation|legal|contract|terms|privacy policy|license agreement)\b/i.test(lowerContent)) {
      return 'legal';
    }
    // Check for finance keywords
    if (/\b(revenue|profit|earnings|financial|fiscal|quarter|balance sheet|income statement|cash flow)\b/i.test(lowerContent)) {
      return 'finance';
    }
    return 'docs';
  }

  // Config files (treat as code)
  const configExts = ['.json', '.yml', '.yaml', '.toml', '.ini'];
  if (configExts.includes(ext)) return 'code';

  return 'general';
}

/**
 * Select best Voyage AI model for content type
 */
export function selectVoyageModel(contentType: ContentType): string {
  const modelMap: Record<ContentType, string> = {
    code: process.env.CTX_EMBED_CODE_MODEL || 'voyage-code-3',
    finance: process.env.CTX_EMBED_FINANCE_MODEL || 'voyage-finance-2',
    legal: process.env.CTX_EMBED_LEGAL_MODEL || 'voyage-law-2',
    docs: process.env.CTX_EMBED_DOCS_MODEL || 'voyage-3-large',
    general: process.env.CTX_EMBED_GENERAL_MODEL || 'voyage-3.5'
  };

  return modelMap[contentType];
}

/**
 * Select best provider based on content type and availability
 * FIX: Voyage is NOT always best - choose intelligently based on task
 */
function selectBestProvider(contentType: ContentType): string[] {
  const hasVoyage = !!(process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasOllama = !!process.env.OLLAMA_BASE_URL;

  // Priority order based on content type
  switch (contentType) {
    case 'code':
      // Voyage Code-3 is BEST for code
      if (hasVoyage) return ['voyage', 'openai', 'ollama'];
      if (hasOpenAI) return ['openai', 'ollama'];
      return ['ollama'];

    case 'finance':
      // Voyage Finance-2 is specialized for finance
      if (hasVoyage) return ['voyage', 'openai', 'ollama'];
      if (hasOpenAI) return ['openai', 'ollama'];
      return ['ollama'];

    case 'legal':
      // Voyage Law-2 is specialized for legal
      if (hasVoyage) return ['voyage', 'openai', 'ollama'];
      if (hasOpenAI) return ['openai', 'ollama'];
      return ['ollama'];

    case 'docs':
      // OpenAI text-embedding-3-large is excellent for general docs and cheaper
      if (hasOpenAI) return ['openai', 'voyage', 'ollama'];
      if (hasVoyage) return ['voyage', 'ollama'];
      return ['ollama'];

    case 'general':
    default:
      // OpenAI is best value for general content (good quality, lower cost)
      if (hasOpenAI) return ['openai', 'voyage', 'ollama'];
      if (hasVoyage) return ['voyage', 'ollama'];
      return ['ollama'];
  }
}

/**
 * Embed batch of texts using configured provider with intelligent model selection
 * Supports: voyage (specialized), openai (general), ollama (free fallback)
 * FIX: Choose best provider based on content type, not always Voyage
 */
export async function embedBatch(texts: string[], options: EmbedOptions = {}): Promise<number[][]> {
  const {
    contentType = 'general',
    inputType = 'document',
    provider = (process.env.CTX_EMBED_PROVIDER || 'auto').toLowerCase() as any
  } = options;

  // Auto-detect content type if file path provided
  let detectedType = contentType;
  if (options.filePath && contentType === 'general') {
    detectedType = detectContentType(options.filePath, texts[0] || '');
  }

  const voyageModel = selectVoyageModel(detectedType);

  console.log(`[embedBatch] Type: ${detectedType}, Model: ${voyageModel}, Input: ${inputType}, Texts: ${texts.length}`);

  // Build provider chain based on content type (intelligent selection)
  const providers = provider === 'auto'
    ? selectBestProvider(detectedType)
    : [provider];

  console.log(`[embedBatch] Provider priority: ${providers.join(' → ')}`);

  for (const prov of providers) {
    try {
      if (prov === 'voyage') {
        return await voyageEmbed(texts, voyageModel, inputType);
      }
      if (prov === 'openai') {
        return await openaiEmbed(texts);
      }
      if (prov === 'ollama') {
        return await ollamaEmbed(texts);
      }
    } catch (error: any) {
      const message = error?.message ?? String(error);
      console.warn(`⚠️  [embedBatch] ${prov} failed (${message}), trying next provider...`);
      // Continue to next provider
    }
  }

  // All providers failed, use lexical fallback
  console.warn(`⚠️  [embedBatch] All providers failed, using lexical fallback`);
  return lexicalFallbackEmbed(texts);
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

async function voyageEmbed(
  texts: string[],
  model: string = 'voyage-code-3',
  inputType: InputType = 'document'
): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('VOYAGE_API_KEY or ANTHROPIC_API_KEY missing');

  console.log(`[voyageEmbed] Model: ${model}, Input type: ${inputType}, Texts: ${texts.length}`);

  // Retry logic with exponential backoff for rate limits
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const r = await request('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${key}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model,
          input: texts,
          input_type: inputType, // 'query' or 'document'
          output_dimension: 1024, // Default for voyage-3 models
          output_dtype: 'float' // Use float for best quality
        })
      });

      const j: any = await r.body.json();

      // Check for rate limit error
      if (r.statusCode === 429 && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.warn(`⚠️  [voyageEmbed] Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!j?.data) {
        throw new Error(`Voyage API error: ${JSON.stringify(j)}`);
      }

      return j.data.map((d: any) => d.embedding);
    } catch (error: any) {
      // If it's a network error and we have retries left, retry
      if (attempt < MAX_RETRIES && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.warn(`⚠️  [voyageEmbed] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Otherwise, throw the error
      throw error;
    }
  }

  throw new Error('Voyage API failed after max retries');
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

