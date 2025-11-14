-- Agent Cortex Phase AC.5: Enable pgvector and add embeddings
-- Adds semantic search capabilities to all Cortex tables

-- ============================================================================
-- ENABLE PGVECTOR EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- ADD EMBEDDING COLUMNS
-- ============================================================================

-- Add embedding to thinking_playbooks
ALTER TABLE thinking_playbooks
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Add embedding to tool_workflows
ALTER TABLE tool_workflows
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Add embedding to code_patterns
ALTER TABLE code_patterns
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Add embedding to capability_registry
ALTER TABLE capability_registry
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Add embedding to knowledge_artifacts (already in schema, but may have been commented out)
ALTER TABLE knowledge_artifacts
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- ============================================================================
-- CREATE VECTOR INDEXES FOR FAST SIMILARITY SEARCH
-- ============================================================================

-- Index for thinking_playbooks
CREATE INDEX IF NOT EXISTS thinking_playbooks_embedding_idx 
ON thinking_playbooks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for tool_workflows
CREATE INDEX IF NOT EXISTS tool_workflows_embedding_idx 
ON tool_workflows 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for code_patterns
CREATE INDEX IF NOT EXISTS code_patterns_embedding_idx 
ON code_patterns 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for capability_registry
CREATE INDEX IF NOT EXISTS capability_registry_embedding_idx 
ON capability_registry 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for knowledge_artifacts
CREATE INDEX IF NOT EXISTS knowledge_artifacts_embedding_idx 
ON knowledge_artifacts 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify pgvector is enabled
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname = 'vector';

-- Verify embedding columns exist
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'embedding'
  AND table_name IN (
    'thinking_playbooks',
    'tool_workflows',
    'code_patterns',
    'capability_registry',
    'knowledge_artifacts'
  )
ORDER BY table_name;

-- Verify indexes exist
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%embedding_idx'
ORDER BY tablename;

