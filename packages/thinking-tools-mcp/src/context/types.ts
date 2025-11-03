export type SourceKind = 'repo' | 'knowledge' | 'web';

export interface Chunk {
  id: string;
  source: SourceKind;
  path: string;
  uri: string;  // Alias for path (for compatibility)
  title?: string;  // Optional title
  sha: string;
  start: number;
  end: number;
  text: string;
  tokens?: number;
  tags?: string[];
  vec?: number[];  // Optional embedding vector (for reranking)
  meta?: { symbols?: string[]; lang?: string; lines?: number };  // Symbol extraction metadata
}

export interface Embedding {
  id: string;
  vec: number[];
}

export interface Hit {
  id: string;
  score: number;
  chunk: Chunk;
}

export interface IndexStats {
  chunks: number;
  embeddings: number;
  vectors: number;  // Same as embeddings
  sources: Record<string, number> | number;  // Can be object or number
  mode?: string;  // Embedding mode (ollama, voyage, etc.)
  model?: string;  // Model name
  dimensions?: number;  // Vector dimensions
  totalCost?: number;  // Total cost
  indexedAt?: string;  // When indexed
  updatedAt: string;
}

