-- Migration 005: Add scope fields to Agent Cortex tables
-- Allows entries to be tagged as 'global' (non-repo-specific) vs 'repo' or 'task' specific
-- Date: 2025-01-14

-- ============================================================================
-- ADD SCOPE FIELDS TO THINKING_PLAYBOOKS
-- ============================================================================
ALTER TABLE thinking_playbooks 
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'global' CHECK (scope IN ('global', 'repo', 'task')),
  ADD COLUMN IF NOT EXISTS scope_repo_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_playbooks_scope ON thinking_playbooks(scope);
CREATE INDEX IF NOT EXISTS idx_playbooks_scope_repo ON thinking_playbooks(scope_repo_id) WHERE scope_repo_id IS NOT NULL;

-- ============================================================================
-- ADD SCOPE FIELDS TO TOOL_WORKFLOWS
-- ============================================================================
ALTER TABLE tool_workflows 
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'global' CHECK (scope IN ('global', 'repo', 'task')),
  ADD COLUMN IF NOT EXISTS scope_repo_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_workflows_scope ON tool_workflows(scope);
CREATE INDEX IF NOT EXISTS idx_workflows_scope_repo ON tool_workflows(scope_repo_id) WHERE scope_repo_id IS NOT NULL;

-- ============================================================================
-- ADD SCOPE FIELDS TO CODE_PATTERNS
-- ============================================================================
ALTER TABLE code_patterns 
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'global' CHECK (scope IN ('global', 'repo', 'task')),
  ADD COLUMN IF NOT EXISTS scope_repo_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_patterns_scope ON code_patterns(scope);
CREATE INDEX IF NOT EXISTS idx_patterns_scope_repo ON code_patterns(scope_repo_id) WHERE scope_repo_id IS NOT NULL;

-- ============================================================================
-- ADD SCOPE FIELDS TO CAPABILITY_REGISTRY
-- ============================================================================
ALTER TABLE capability_registry 
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'global' CHECK (scope IN ('global', 'repo', 'task')),
  ADD COLUMN IF NOT EXISTS scope_repo_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_capabilities_scope ON capability_registry(scope);
CREATE INDEX IF NOT EXISTS idx_capabilities_scope_repo ON capability_registry(scope_repo_id) WHERE scope_repo_id IS NOT NULL;

-- ============================================================================
-- ADD SCOPE FIELDS TO KNOWLEDGE_ARTIFACTS
-- ============================================================================
ALTER TABLE knowledge_artifacts 
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'global' CHECK (scope IN ('global', 'repo', 'task')),
  ADD COLUMN IF NOT EXISTS scope_repo_id VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_artifacts_scope ON knowledge_artifacts(scope);
CREATE INDEX IF NOT EXISTS idx_artifacts_scope_repo ON knowledge_artifacts(scope_repo_id) WHERE scope_repo_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN (
    'thinking_playbooks',
    'tool_workflows',
    'code_patterns',
    'capability_registry',
    'knowledge_artifacts'
  )
  AND column_name IN ('scope', 'scope_repo_id')
ORDER BY table_name, column_name;

