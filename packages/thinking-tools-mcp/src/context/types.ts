export type SourceKind = 'repo' | 'knowledge' | 'web';

export interface Chunk {
  id: string;
  source: SourceKind;
  path: string;
  sha: string;
  start: number;
  end: number;
  text: string;
  tokens?: number;
  tags?: string[];
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
  sources: Record<string, number>;
  updatedAt: string;
}

