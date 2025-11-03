/**
 * Cross-Encoder Reranking (Optional Quality Boost)
 * 
 * Supports:
 * - Cohere Rerank 3.5 (via API or AWS Bedrock)
 * - BGE Reranker (open source, local)
 * 
 * Usage: Call after initial ranking to re-score top 50 candidates
 * Adds +60-120ms latency but improves quality significantly
 */

export type RerankCandidate = {
  uri: string;
  title: string;
  text: string;
  score?: number; // existing score
};

export type RerankResult = RerankCandidate & {
  rerankScore: number; // cross-encoder score
  finalScore: number;  // combined score
};

/**
 * Cohere Rerank API
 */
async function cohereRerank(query: string, docs: RerankCandidate[], topN: number = 50): Promise<RerankResult[]> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    console.warn('[cross_encoder] COHERE_API_KEY not set, skipping rerank');
    return docs.map(d => ({ ...d, rerankScore: d.score ?? 0, finalScore: d.score ?? 0 }));
  }

  try {
    const response = await fetch('https://api.cohere.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'rerank-english-v3.0', // or 'rerank-multilingual-v3.0'
        query,
        documents: docs.map(d => d.text.substring(0, 2000)), // Cohere limit
        top_n: topN,
        return_documents: false
      })
    });

    if (!response.ok) {
      console.error('[cross_encoder] Cohere API error:', response.statusText);
      return docs.map(d => ({ ...d, rerankScore: d.score ?? 0, finalScore: d.score ?? 0 }));
    }

    const data = await response.json();
    const results: RerankResult[] = [];

    for (const result of data.results) {
      const doc = docs[result.index];
      const rerankScore = result.relevance_score; // 0..1
      const finalScore = (doc.score ?? 0) * 0.5 + rerankScore * 0.5; // average
      results.push({ ...doc, rerankScore, finalScore });
    }

    return results.sort((a, b) => b.finalScore - a.finalScore);
  } catch (error: any) {
    console.error('[cross_encoder] Cohere rerank failed:', error.message);
    return docs.map(d => ({ ...d, rerankScore: d.score ?? 0, finalScore: d.score ?? 0 }));
  }
}

/**
 * BGE Reranker (local, open source)
 * Requires running a local BGE reranker service
 */
async function bgeRerank(query: string, docs: RerankCandidate[], topN: number = 50): Promise<RerankResult[]> {
  const endpoint = process.env.BGE_RERANK_ENDPOINT || 'http://localhost:8000/rerank';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        documents: docs.map(d => d.text.substring(0, 2000)),
        top_n: topN
      })
    });

    if (!response.ok) {
      console.warn('[cross_encoder] BGE endpoint not available, skipping rerank');
      return docs.map(d => ({ ...d, rerankScore: d.score ?? 0, finalScore: d.score ?? 0 }));
    }

    const data = await response.json();
    const results: RerankResult[] = [];

    for (let i = 0; i < data.scores.length; i++) {
      const doc = docs[i];
      const rerankScore = data.scores[i]; // normalized 0..1
      const finalScore = (doc.score ?? 0) * 0.5 + rerankScore * 0.5;
      results.push({ ...doc, rerankScore, finalScore });
    }

    return results.sort((a, b) => b.finalScore - a.finalScore);
  } catch (error: any) {
    console.warn('[cross_encoder] BGE rerank failed:', error.message);
    return docs.map(d => ({ ...d, rerankScore: d.score ?? 0, finalScore: d.score ?? 0 }));
  }
}

/**
 * Auto-select reranker based on environment
 */
export async function crossEncoderRerank(
  query: string,
  docs: RerankCandidate[],
  topN: number = 50,
  provider?: 'cohere' | 'bge' | 'auto'
): Promise<RerankResult[]> {
  const p = provider ?? 'auto';

  if (p === 'auto') {
    // Auto-select based on available credentials
    if (process.env.COHERE_API_KEY) {
      return cohereRerank(query, docs, topN);
    } else if (process.env.BGE_RERANK_ENDPOINT) {
      return bgeRerank(query, docs, topN);
    } else {
      // No reranker available, return as-is
      console.warn('[cross_encoder] No reranker configured, skipping');
      return docs.map(d => ({ ...d, rerankScore: d.score ?? 0, finalScore: d.score ?? 0 }));
    }
  }

  if (p === 'cohere') return cohereRerank(query, docs, topN);
  if (p === 'bge') return bgeRerank(query, docs, topN);

  return docs.map(d => ({ ...d, rerankScore: d.score ?? 0, finalScore: d.score ?? 0 }));
}

