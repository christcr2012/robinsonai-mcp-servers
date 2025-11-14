-- Agent Cortex Schema Migration
-- Extends RAD Memory with Agent Cortex tables for advanced learning and planning

-- ============================================================================
-- THINKING PLAYBOOKS
-- Stores reusable thinking tool sequences for different task types
-- ============================================================================
CREATE TABLE IF NOT EXISTS thinking_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  task_pattern VARCHAR(255) NOT NULL, -- Regex or keyword pattern to match tasks
  tool_sequence JSONB NOT NULL, -- Array of {tool: string, params?: object}
  priority INTEGER DEFAULT 0, -- Higher priority playbooks are preferred
  success_rate FLOAT DEFAULT 0.0, -- Track effectiveness over time
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_playbooks_pattern ON thinking_playbooks(task_pattern);
CREATE INDEX IF NOT EXISTS idx_playbooks_priority ON thinking_playbooks(priority DESC);

-- ============================================================================
-- TOOL WORKFLOWS
-- Stores multi-step workflows that combine Toolkit tools
-- ============================================================================
CREATE TABLE IF NOT EXISTS tool_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'deployment', 'database', 'analysis'
  steps JSONB NOT NULL, -- Array of {id, tool, params, dependencies: string[]}
  prerequisites JSONB DEFAULT '[]'::jsonb, -- Required capabilities or env vars
  success_rate FLOAT DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_workflows_category ON tool_workflows(category);
CREATE INDEX IF NOT EXISTS idx_workflows_success ON tool_workflows(success_rate DESC);

-- ============================================================================
-- CODE PATTERNS
-- Stores reusable code templates and patterns
-- ============================================================================
CREATE TABLE IF NOT EXISTS code_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  pattern_type VARCHAR(100) NOT NULL, -- e.g., 'mcp_handler', 'error_wrapper', 'client_pattern'
  language VARCHAR(50) NOT NULL, -- e.g., 'typescript', 'python', 'sql'
  template TEXT NOT NULL, -- Code template with placeholders
  variables JSONB DEFAULT '[]'::jsonb, -- Array of {name, type, description, default?}
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_patterns_type ON code_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_language ON code_patterns(language);
CREATE INDEX IF NOT EXISTS idx_patterns_tags ON code_patterns USING GIN(tags);

-- ============================================================================
-- CAPABILITY REGISTRY
-- Stores high-level capabilities that agents can perform
-- ============================================================================
CREATE TABLE IF NOT EXISTS capability_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'infrastructure', 'analysis', 'deployment'
  required_tools TEXT[] NOT NULL, -- Tools needed to execute this capability
  required_env_vars TEXT[] DEFAULT '{}', -- Environment variables needed
  workflow_id UUID REFERENCES tool_workflows(id) ON DELETE SET NULL,
  complexity VARCHAR(50) DEFAULT 'medium', -- 'simple', 'medium', 'complex', 'expert'
  estimated_duration_minutes INTEGER,
  success_rate FLOAT DEFAULT 0.0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_capabilities_category ON capability_registry(category);
CREATE INDEX IF NOT EXISTS idx_capabilities_complexity ON capability_registry(complexity);

-- ============================================================================
-- KNOWLEDGE ARTIFACTS
-- Stores planning and execution artifacts for future reference
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  artifact_type VARCHAR(100) NOT NULL, -- 'thinking_output', 'plan', 'decision', 'execution_summary'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  format VARCHAR(50) DEFAULT 'markdown', -- 'markdown', 'json', 'yaml'
  -- embedding VECTOR(1536), -- For semantic search (will be added in Phase AC.5 with pgvector)
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_artifacts_task ON knowledge_artifacts(task_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON knowledge_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_artifacts_tags ON knowledge_artifacts USING GIN(tags);
-- Vector index will be added in Phase AC.5 when pgvector is enabled:
-- ALTER TABLE knowledge_artifacts ADD COLUMN embedding VECTOR(1536);
-- CREATE INDEX idx_artifacts_embedding ON knowledge_artifacts USING ivfflat (embedding vector_cosine_ops);

-- ============================================================================
-- EVIDENCE CACHE
-- Caches evidence bundles to avoid redundant work
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) NOT NULL UNIQUE, -- Hash of (task_description, repo, constraints)
  evidence_bundle JSONB NOT NULL, -- Full EvidenceBundle object
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- TTL-based expiration
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_cache_key ON evidence_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_evidence_cache_expires ON evidence_cache(expires_at);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'thinking_playbooks',
    'tool_workflows',
    'code_patterns',
    'capability_registry',
    'knowledge_artifacts',
    'evidence_cache'
  )
ORDER BY table_name;

