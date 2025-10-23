-- Multi-Tenant RAD Crawler Schema
-- Supports multiple users/organizations sharing same database
-- Each tenant's data is isolated via tenant_id

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Limits
  crawler_limit INTEGER DEFAULT 5,
  storage_limit_mb INTEGER DEFAULT 1000,
  monthly_crawl_limit INTEGER DEFAULT 10000,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_tenants_api_key ON tenants(api_key);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Sources table (multi-tenant)
CREATE TABLE IF NOT EXISTS sources (
  source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  uri TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('web', 'repo', 'file')),
  discovered_at TIMESTAMP DEFAULT NOW(),
  last_crawled_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sources_tenant ON sources(tenant_id);
CREATE INDEX idx_sources_uri ON sources(uri);
CREATE INDEX idx_sources_type ON sources(source_type);
CREATE UNIQUE INDEX idx_sources_tenant_uri ON sources(tenant_id, uri);

-- Documents table (multi-tenant)
CREATE TABLE IF NOT EXISTS documents (
  doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  source_id UUID REFERENCES sources(source_id) ON DELETE CASCADE,
  uri TEXT NOT NULL,
  title TEXT,
  content_hash TEXT NOT NULL,
  simhash BIGINT,
  indexed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_source ON documents(source_id);
CREATE INDEX idx_documents_hash ON documents(content_hash);
CREATE INDEX idx_documents_simhash ON documents(simhash);
CREATE UNIQUE INDEX idx_documents_tenant_uri ON documents(tenant_id, uri);

-- Document blobs table (multi-tenant)
CREATE TABLE IF NOT EXISTS doc_blobs (
  doc_id UUID PRIMARY KEY REFERENCES documents(doc_id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  content_html TEXT,
  content_markdown TEXT
);

CREATE INDEX idx_doc_blobs_tenant ON doc_blobs(tenant_id);

-- Chunks table with embeddings (multi-tenant)
CREATE TABLE IF NOT EXISTS chunks (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  doc_id UUID NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_chunks_tenant ON chunks(tenant_id);
CREATE INDEX idx_chunks_doc ON chunks(doc_id);
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Jobs table (multi-tenant)
CREATE TABLE IF NOT EXISTS jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('crawl', 'ingest_repo')),
  state TEXT NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'running', 'completed', 'failed')),
  params JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT,
  result JSONB
);

CREATE INDEX idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX idx_jobs_state ON jobs(state);
CREATE INDEX idx_jobs_created ON jobs(created_at);

-- Policy table (multi-tenant)
CREATE TABLE IF NOT EXISTS policy (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  max_pages INTEGER DEFAULT 200,
  max_depth INTEGER DEFAULT 3,
  rate_per_domain_per_min INTEGER DEFAULT 10,
  allowlist TEXT[] DEFAULT '{}',
  denylist TEXT[] DEFAULT ARRAY['accounts.*', '*/logout', '*/login'],
  respect_robots_txt BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tenant usage tracking
CREATE TABLE IF NOT EXISTS tenant_usage (
  usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metrics
  pages_crawled INTEGER DEFAULT 0,
  storage_used_mb REAL DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  
  -- Costs (if applicable)
  cost_usd REAL DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX idx_tenant_usage_period ON tenant_usage(period_start, period_end);
CREATE UNIQUE INDEX idx_tenant_usage_tenant_period ON tenant_usage(tenant_id, period_start);

-- Crawler instances (for coordination)
CREATE TABLE IF NOT EXISTS crawler_instances (
  instance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'stopped')),
  last_heartbeat TIMESTAMP DEFAULT NOW(),
  current_job_id UUID REFERENCES jobs(job_id),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_crawler_instances_tenant ON crawler_instances(tenant_id);
CREATE INDEX idx_crawler_instances_status ON crawler_instances(status);
CREATE INDEX idx_crawler_instances_heartbeat ON crawler_instances(last_heartbeat);

-- Full-text search (multi-tenant aware)
CREATE INDEX idx_chunks_fts ON chunks USING gin(to_tsvector('english', chunk_text));

-- Helper function: Get tenant by API key
CREATE OR REPLACE FUNCTION get_tenant_by_api_key(api_key_param TEXT)
RETURNS UUID AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT tenant_id INTO tenant_uuid
  FROM tenants
  WHERE api_key = api_key_param AND status = 'active';
  
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive API key';
  END IF;
  
  RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Check tenant limits
CREATE OR REPLACE FUNCTION check_tenant_limits(tenant_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  tenant_rec RECORD;
  usage_rec RECORD;
  result JSONB;
BEGIN
  -- Get tenant info
  SELECT * INTO tenant_rec FROM tenants WHERE tenant_id = tenant_uuid;
  
  -- Get current month usage
  SELECT * INTO usage_rec FROM tenant_usage
  WHERE tenant_id = tenant_uuid
    AND period_start = DATE_TRUNC('month', NOW())::DATE
  LIMIT 1;
  
  -- Build result
  result := jsonb_build_object(
    'crawler_limit', tenant_rec.crawler_limit,
    'storage_limit_mb', tenant_rec.storage_limit_mb,
    'monthly_crawl_limit', tenant_rec.monthly_crawl_limit,
    'pages_crawled_this_month', COALESCE(usage_rec.pages_crawled, 0),
    'storage_used_mb', COALESCE(usage_rec.storage_used_mb, 0),
    'within_limits', (
      COALESCE(usage_rec.pages_crawled, 0) < tenant_rec.monthly_crawl_limit AND
      COALESCE(usage_rec.storage_used_mb, 0) < tenant_rec.storage_limit_mb
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Record usage
CREATE OR REPLACE FUNCTION record_tenant_usage(
  tenant_uuid UUID,
  pages_delta INTEGER DEFAULT 0,
  storage_delta_mb REAL DEFAULT 0,
  api_calls_delta INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  current_period_start DATE;
BEGIN
  current_period_start := DATE_TRUNC('month', NOW())::DATE;
  
  INSERT INTO tenant_usage (tenant_id, period_start, period_end, pages_crawled, storage_used_mb, api_calls)
  VALUES (
    tenant_uuid,
    current_period_start,
    (current_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
    pages_delta,
    storage_delta_mb,
    api_calls_delta
  )
  ON CONFLICT (tenant_id, period_start)
  DO UPDATE SET
    pages_crawled = tenant_usage.pages_crawled + pages_delta,
    storage_used_mb = tenant_usage.storage_used_mb + storage_delta_mb,
    api_calls = tenant_usage.api_calls + api_calls_delta;
END;
$$ LANGUAGE plpgsql;

-- Sample tenant (for testing)
INSERT INTO tenants (name, api_key, crawler_limit, storage_limit_mb, monthly_crawl_limit)
VALUES (
  'Default Tenant',
  'rad_' || encode(gen_random_bytes(32), 'hex'),
  10,
  5000,
  50000
)
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

