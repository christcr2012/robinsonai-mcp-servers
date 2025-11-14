/**
 * Embeddings utility for Agent Cortex
 * Generates embeddings using Voyage AI (free tier) or OpenAI
 */

import https from 'https';

export interface EmbeddingOptions {
  provider?: 'voyage' | 'openai' | 'moonshot';
  model?: string;
  apiKey?: string;
}

/**
 * Generate embedding for text using configured provider
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[] | null> {
  const provider = options.provider || process.env.EMBEDDING_PROVIDER || 'voyage';
  
  try {
    switch (provider) {
      case 'voyage':
        return await generateVoyageEmbedding(text, options);
      case 'openai':
        return await generateOpenAIEmbedding(text, options);
      case 'moonshot':
        return await generateMoonshotEmbedding(text, options);
      default:
        console.warn(`Unknown embedding provider: ${provider}, falling back to Voyage`);
        return await generateVoyageEmbedding(text, options);
    }
  } catch (error) {
    console.error(`Error generating embedding with ${provider}:`, error);
    return null;
  }
}

/**
 * Generate embedding using Voyage AI
 * Free tier: 100M tokens/month
 */
async function generateVoyageEmbedding(
  text: string,
  options: EmbeddingOptions
): Promise<number[]> {
  const apiKey = options.apiKey || process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY not set');
  }

  const model = options.model || 'voyage-3';
  
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voyage API error: ${response.statusText}`);
  }

  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

/**
 * Generate embedding using OpenAI
 */
async function generateOpenAIEmbedding(
  text: string,
  options: EmbeddingOptions
): Promise<number[]> {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const model = options.model || 'text-embedding-3-small';
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

/**
 * Generate embedding using Moonshot (Kimi)
 */
async function generateMoonshotEmbedding(
  text: string,
  options: EmbeddingOptions
): Promise<number[]> {
  const apiKey = options.apiKey || process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    throw new Error('MOONSHOT_API_KEY not set');
  }

  const model = options.model || 'moonshot-v1-8k';

  const response = await fetch('https://api.moonshot.cn/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model,
    }),
  });

  if (!response.ok) {
    throw new Error(`Moonshot API error: ${response.statusText}`);
  }

  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

/**
 * Compute cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

