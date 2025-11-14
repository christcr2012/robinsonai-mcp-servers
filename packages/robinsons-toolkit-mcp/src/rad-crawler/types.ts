/**
 * RAD Crawler Core Types
 */

export interface RadSource {
  id: string;
  name: string;
  sourceType: 'git_repo' | 'filesystem' | 'web' | 'api';
  config: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface RadCrawl {
  id: string;
  sourceId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  documentsDiscovered: number;
  documentsProcessed: number;
  documentsFailed: number;
  chunksCreated: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface RadDocument {
  id: string;
  sourceId: string;
  crawlId: string;
  externalId: string; // file path, URL, etc.
  docType: string; // 'code', 'markdown', 'config', 'test', etc.
  language?: string; // programming language
  contentHash: string; // SHA-256
  sizeBytes: number;
  lastCrawledAt: Date;
  metadata?: Record<string, any>;
}

export interface RadChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  startLine?: number;
  endLine?: number;
  tokenCount?: number;
  embedding?: number[]; // Optional in v1
  metadata?: Record<string, any>;
}

export interface RadCrawlerConfig {
  databaseUrl: string;
  tempDir?: string;
  maxConcurrency?: number;
  chunkSize?: number; // lines per chunk
  chunkOverlap?: number; // lines of overlap
}

export interface RunCrawlOptions {
  sourceId: string;
  overrides?: {
    entrypoints?: string[];
    excludePatterns?: string[];
    includePatterns?: string[];
    maxDepth?: number;
    followSymlinks?: boolean;
  };
}

export interface CrawlResult {
  crawlId: string;
  status: RadCrawl['status'];
  startedAt: Date;
  completedAt?: Date;
  documentsDiscovered: number;
  documentsProcessed: number;
  documentsFailed: number;
  chunksCreated: number;
  errorMessage?: string;
}

export interface DiscoveredFile {
  path: string;
  relativePath: string;
  sizeBytes: number;
  extension: string;
}

export interface ParsedDocument {
  externalId: string;
  docType: string;
  language?: string;
  content: string;
  contentHash: string;
  sizeBytes: number;
  metadata?: Record<string, any>;
}

export interface DocumentChunk {
  chunkIndex: number;
  content: string;
  startLine?: number;
  endLine?: number;
  tokenCount?: number;
  metadata?: Record<string, any>;
}

export interface CrawlStats {
  discovered: number;
  processed: number;
  failed: number;
  chunks: number;
}

