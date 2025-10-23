-- RAD Crawler Database Schema for Neon Postgres
-- Run this in your Neon SQL console

-- Enable pgvector extension (run as superuser in Neon console)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Sources table: web domains, repos, or agent logs
CREATE TABLE IF NOT EXISTS sources (
  source_id  BIGSERIAL PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('web','repo','agent-log')),
  uri        TEXT NOT NULL,              -- URL, repo URL, or log stream key
  domain     TEXT,                       -- for web
  repo       TEXT,                       -- for repos
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kind, uri)
);

CREATE INDEX IF NOT EXISTS sources_kind_idx ON sources(kind);
CREATE INDEX IF NOT EXISTS sources_domain_idx ON sources(domain) WHERE domain IS NOT NULL;

-- Documents table: individual pages or files
CREATE TABLE IF NOT EXISTS documents (
  doc_id     BIGSERIAL PRIMARY KEY,
  source_id  BIGINT REFERENCES sources(source_id) ON DELETE CASCADE,
  uri        TEXT,                       -- page URL or file path
  title      TEXT,
  lang       TEXT,
  hash_sha1  TEXT NOT NULL,
  fetched_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active  BOOLEAN DEFAULT TRUE,
  UNIQUE(source_id, uri, hash_sha1)
);

CREATE INDEX IF NOT EXISTS documents_source_idx ON documents(source_id);
CREATE INDEX IF NOT EXISTS documents_hash_idx ON documents(hash_sha1);
CREATE INDEX IF NOT EXISTS documents_active_idx ON documents(is_active) WHERE is_active = TRUE;

-- Document blobs: raw or normalized text (paged on retrieval)
CREATE TABLE IF NOT EXISTS doc_blobs (
  doc_id     BIGINT REFERENCES documents(doc_id) ON DELETE CASCADE,
  part_ix    INT NOT NULL,
  content    TEXT NOT NULL,
  PRIMARY KEY (doc_id, part_ix)
);

-- Chunks table: text chunks with FTS and semantic embeddings
CREATE TABLE IF NOT EXISTS chunks (
  chunk_id   BIGSERIAL PRIMARY KEY,
  doc_id     BIGINT REFERENCES documents(doc_id) ON DELETE CASCADE,
  ix         INT NOT NULL,            -- chunk order in doc
  text       TEXT NOT NULL,
  ts         tsvector,                -- FTS index
  embedding  vector(768),             -- pgvector embedding (adjust dimension as needed)
  meta       JSONB                    -- {h2_path, anchors, tokens, language, file_path, etc.}
);

CREATE INDEX IF NOT EXISTS chunks_doc_ix ON chunks(doc_id, ix);
CREATE INDEX IF NOT EXISTS chunks_fts_ix ON chunks USING GIN (ts);
-- Uncomment after enabling pgvector:
-- CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Jobs table: crawl and repo ingest jobs
CREATE TABLE IF NOT EXISTS jobs (
  job_id     BIGSERIAL PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('crawl','repo_ingest')),
  params     JSONB NOT NULL,
  state      TEXT NOT NULL DEFAULT 'queued', -- queued|running|done|error
  progress   JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error      TEXT
);

CREATE INDEX IF NOT EXISTS jobs_state_idx ON jobs(state) WHERE state IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS jobs_created_idx ON jobs(created_at DESC);

-- Policy table: governance rules
CREATE TABLE IF NOT EXISTS policy (
  policy_id  BIGSERIAL PRIMARY KEY,
  allowlist  TEXT[],          -- domains
  denylist   TEXT[],          -- domains/paths
  budgets    JSONB,           -- {max_pages_per_job, max_depth, rate_per_domain}
  created_at TIMESTAMPTZ DEFAULT now(),
  active     BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS policy_active_idx ON policy(active) WHERE active = TRUE;

-- Insert default policy
INSERT INTO policy (allowlist, denylist, budgets, active)
VALUES (
  ARRAY[]::TEXT[],
  ARRAY['accounts.*', '*/logout', '*/login'],
  '{"max_pages_per_job": 200, "max_depth": 3, "rate_per_domain": 10}'::JSONB,
  TRUE
)
ON CONFLICT DO NOTHING;

