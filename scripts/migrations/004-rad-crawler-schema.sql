-- RAD Crawler Schema Extension
-- Adds crawler + document tables to existing RAD database
-- Extends RAD Memory with document indexing capabilities

-- ============================================================================
-- rad_sources: Registered sources for crawling (repos, filesystems, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rad_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('git_repo', 'filesystem', 'web', 'api')),
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_rad_sources_type ON rad_sources(source_type);
CREATE INDEX idx_rad_sources_enabled ON rad_sources(enabled);

-- ============================================================================
-- rad_crawls: Crawl execution records
-- ============================================================================
CREATE TABLE IF NOT EXISTS rad_crawls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES rad_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  documents_discovered INTEGER DEFAULT 0,
  documents_processed INTEGER DEFAULT 0,
  documents_failed INTEGER DEFAULT 0,
  chunks_created INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_rad_crawls_source ON rad_crawls(source_id);
CREATE INDEX idx_rad_crawls_status ON rad_crawls(status);
CREATE INDEX idx_rad_crawls_started ON rad_crawls(started_at DESC);

-- ============================================================================
-- rad_documents: Discovered documents from crawls
-- ============================================================================
CREATE TABLE IF NOT EXISTS rad_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES rad_sources(id) ON DELETE CASCADE,
  crawl_id UUID NOT NULL REFERENCES rad_crawls(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- file path, URL, etc.
  doc_type TEXT NOT NULL, -- 'code', 'markdown', 'config', 'test', etc.
  language TEXT, -- programming language or 'markdown', 'json', etc.
  content_hash TEXT NOT NULL, -- SHA-256 of content for deduplication
  size_bytes INTEGER NOT NULL,
  last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(source_id, external_id)
);

CREATE INDEX idx_rad_documents_source ON rad_documents(source_id);
CREATE INDEX idx_rad_documents_crawl ON rad_documents(crawl_id);
CREATE INDEX idx_rad_documents_type ON rad_documents(doc_type);
CREATE INDEX idx_rad_documents_language ON rad_documents(language);
CREATE INDEX idx_rad_documents_hash ON rad_documents(content_hash);
CREATE INDEX idx_rad_documents_crawled ON rad_documents(last_crawled_at DESC);

-- ============================================================================
-- rad_chunks: Text chunks from documents for retrieval
-- ============================================================================
CREATE TABLE IF NOT EXISTS rad_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES rad_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL, -- 0-based position in document
  content TEXT NOT NULL,
  start_line INTEGER,
  end_line INTEGER,
  token_count INTEGER,
  embedding VECTOR(1536), -- Optional: for semantic search (nullable in v1)
  metadata JSONB DEFAULT '{}',
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_rad_chunks_document ON rad_chunks(document_id);
CREATE INDEX idx_rad_chunks_index ON rad_chunks(chunk_index);

-- Add vector index for semantic search (when embeddings are populated)
-- Using IVFFlat with cosine distance (same as Agent Cortex)
CREATE INDEX IF NOT EXISTS idx_rad_chunks_embedding 
  ON rad_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- Helper views for common queries
-- ============================================================================

-- Active sources with latest crawl info
CREATE OR REPLACE VIEW rad_sources_summary AS
SELECT 
  s.id,
  s.name,
  s.source_type,
  s.enabled,
  s.created_at,
  s.updated_at,
  COUNT(DISTINCT c.id) as total_crawls,
  MAX(c.started_at) as last_crawl_at,
  SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as successful_crawls,
  SUM(CASE WHEN c.status = 'failed' THEN 1 ELSE 0 END) as failed_crawls
FROM rad_sources s
LEFT JOIN rad_crawls c ON s.id = c.source_id
GROUP BY s.id, s.name, s.source_type, s.enabled, s.created_at, s.updated_at;

-- Document statistics by source
CREATE OR REPLACE VIEW rad_documents_summary AS
SELECT 
  s.id as source_id,
  s.name as source_name,
  COUNT(DISTINCT d.id) as total_documents,
  COUNT(DISTINCT d.doc_type) as unique_doc_types,
  COUNT(DISTINCT d.language) as unique_languages,
  SUM(d.size_bytes) as total_size_bytes,
  MAX(d.last_crawled_at) as last_crawled_at,
  COUNT(DISTINCT c.id) as total_chunks
FROM rad_sources s
LEFT JOIN rad_documents d ON s.id = d.source_id
LEFT JOIN rad_chunks c ON d.id = c.document_id
GROUP BY s.id, s.name;

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Verify tables exist
SELECT 
  'rad_sources' as table_name, 
  COUNT(*) as row_count 
FROM rad_sources
UNION ALL
SELECT 
  'rad_crawls' as table_name, 
  COUNT(*) as row_count 
FROM rad_crawls
UNION ALL
SELECT 
  'rad_documents' as table_name, 
  COUNT(*) as row_count 
FROM rad_documents
UNION ALL
SELECT 
  'rad_chunks' as table_name, 
  COUNT(*) as row_count 
FROM rad_chunks;

