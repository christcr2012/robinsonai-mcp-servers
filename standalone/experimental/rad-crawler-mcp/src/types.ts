/**
 * RAD Crawler Types
 */

export interface Config {
  neonDatabaseUrl: string;
  ollamaBaseUrl: string;
  defaultEmbedModel: string;
  maxPages: number;
  maxDepth: number;
  ratePerDomainPerMin: number;
  allowlist: string[];
  denylist: string[];
  respectRobotsTxt: boolean;
  chunkSize: number;
  chunkOverlap: number;
  embeddingDimension: number;
}

export interface CrawlPlan {
  goal: string;
  seedUrls: string[];
  allowedDomains: string[];
  deniedPatterns: string[];
  maxDepth: number;
  maxPages: number;
  classifiers?: string[];
  budgets: CrawlBudgets;
}

export interface CrawlBudgets {
  max_pages_per_job: number;
  max_depth: number;
  rate_per_domain: number;
  timeout_ms?: number;
}

export interface SeedParams {
  urls: string[];
  allow?: string[];
  deny?: string[];
  max_depth?: number;
  max_pages?: number;
  recrawl_days?: number;
}

export interface IngestRepoParams {
  repo_url: string;
  branch?: string;
  include?: string[];
  exclude?: string[];
}

export interface Job {
  job_id: number;
  kind: 'crawl' | 'repo_ingest';
  params: any;
  state: 'queued' | 'running' | 'done' | 'error';
  progress?: JobProgress;
  created_at: Date;
  started_at?: Date;
  finished_at?: Date;
  error?: string;
}

export interface JobProgress {
  pages_crawled?: number;
  pages_total?: number;
  files_processed?: number;
  files_total?: number;
  current_url?: string;
  current_file?: string;
  chunks_created?: number;
  errors?: string[];
}

export interface Source {
  source_id: number;
  kind: 'web' | 'repo' | 'agent-log';
  uri: string;
  domain?: string;
  repo?: string;
  created_at: Date;
}

export interface Document {
  doc_id: number;
  source_id: number;
  uri: string;
  title?: string;
  lang?: string;
  hash_sha1: string;
  fetched_at?: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface Chunk {
  chunk_id: number;
  doc_id: number;
  ix: number;
  text: string;
  embedding?: number[];
  meta?: ChunkMeta;
}

export interface ChunkMeta {
  h2_path?: string[];
  anchors?: string[];
  tokens?: number;
  language?: string;
  file_path?: string;
}

export interface SearchResult {
  doc_id: number;
  chunk_id: number;
  uri: string;
  title?: string;
  snippet: string;
  score: number;
  meta?: ChunkMeta;
}

export interface Policy {
  policy_id: number;
  allowlist: string[];
  denylist: string[];
  budgets: CrawlBudgets;
  created_at: Date;
  active: boolean;
}

export interface GovernParams {
  allowlist?: string[];
  denylist?: string[];
  budgets?: Partial<CrawlBudgets>;
}

export interface IndexStats {
  pages: number;
  repos: number;
  chunks: number;
  tokens: number;
  last_crawl?: Date;
  storage_mb: number;
  sources_by_kind: Record<string, number>;
}

export interface CrawlContext {
  job: Job;
  policy: Policy;
  visitedUrls: Set<string>;
  urlQueue: Array<{ url: string; depth: number }>;
  pagesCrawled: number;
  rateLimiters: Map<string, any>;
}

export interface ExtractedContent {
  text: string;
  title?: string;
  h1?: string;
  h2Path: string[];
  anchors: string[];
  lang?: string;
  canonicalUrl?: string;
}

export interface RepoAnalysis {
  repo_url: string;
  branch: string;
  files: RepoFile[];
  directoryMap: DirectoryNode;
  summary?: string;
}

export interface RepoFile {
  path: string;
  content: string;
  language?: string;
  size: number;
  hash: string;
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  summary?: string;
}

