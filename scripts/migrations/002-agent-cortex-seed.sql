-- Agent Cortex Initial Seeding
-- Provides starter brain with playbooks, workflows, patterns, and capabilities

-- ============================================================================
-- THINKING PLAYBOOKS
-- ============================================================================

-- Hot Bugfix Playbook
INSERT INTO thinking_playbooks (name, description, task_pattern, tool_sequence, priority, metadata)
VALUES (
  'Hot Bugfix',
  'Fast-track critical bug fixes with minimal analysis',
  '(urgent|critical|hotfix|production.*down|p0|sev1)',
  '[
    {"tool": "framework_first_principles", "params": {"totalSteps": 3}},
    {"tool": "framework_red_team", "params": {"totalSteps": 3}},
    {"tool": "framework_decision_matrix"}
  ]'::jsonb,
  100,
  '{"tags": ["bugfix", "urgent", "fast-track"]}'::jsonb
);

-- Difficult Refactor Playbook
INSERT INTO thinking_playbooks (name, description, task_pattern, tool_sequence, priority, metadata)
VALUES (
  'Difficult Refactor',
  'Comprehensive analysis for complex refactoring tasks',
  '(refactor|restructure|redesign|technical.*debt)',
  '[
    {"tool": "framework_first_principles", "params": {"totalSteps": 5}},
    {"tool": "framework_systems_thinking", "params": {"totalSteps": 5}},
    {"tool": "framework_premortem", "params": {"totalSteps": 5}},
    {"tool": "framework_blue_team", "params": {"totalSteps": 5}},
    {"tool": "framework_red_team", "params": {"totalSteps": 5}},
    {"tool": "framework_decision_matrix"}
  ]'::jsonb,
  80,
  '{"tags": ["refactor", "complex", "comprehensive"]}'::jsonb
);

-- New Feature with Unknown Impacts
INSERT INTO thinking_playbooks (name, description, task_pattern, tool_sequence, priority, metadata)
VALUES (
  'New Feature - Unknown Impacts',
  'Thorough analysis for features with unclear scope or impacts',
  '(new.*feature|implement|add.*functionality|unknown|unclear)',
  '[
    {"tool": "framework_first_principles", "params": {"totalSteps": 5}},
    {"tool": "framework_scenario_planning", "params": {"totalSteps": 4}},
    {"tool": "framework_premortem", "params": {"totalSteps": 5}},
    {"tool": "framework_swot"},
    {"tool": "framework_decision_matrix"}
  ]'::jsonb,
  70,
  '{"tags": ["feature", "analysis", "planning"]}'::jsonb
);

-- Repo-wide Audit
INSERT INTO thinking_playbooks (name, description, task_pattern, tool_sequence, priority, metadata)
VALUES (
  'Repo-wide Audit',
  'Systematic analysis for repository-wide changes or audits',
  '(audit|repo.*wide|codebase|migration|upgrade)',
  '[
    {"tool": "framework_systems_thinking", "params": {"totalSteps": 5}},
    {"tool": "framework_swot"},
    {"tool": "framework_premortem", "params": {"totalSteps": 5}},
    {"tool": "framework_decision_matrix"}
  ]'::jsonb,
  60,
  '{"tags": ["audit", "repo-wide", "systematic"]}'::jsonb
);

-- ============================================================================
-- TOOL WORKFLOWS
-- ============================================================================

-- GitHub + Neon + Vercel Deployment
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'Full Stack Deployment',
  'Deploy a full-stack app: GitHub repo → Neon database → Vercel hosting',
  'deployment',
  '[
    {"id": "create_repo", "tool": "github_create_repo", "params": {}, "dependencies": []},
    {"id": "create_db", "tool": "neon_create_project", "params": {}, "dependencies": []},
    {"id": "deploy_app", "tool": "vercel_deploy", "params": {}, "dependencies": ["create_repo", "create_db"]}
  ]'::jsonb,
  '["GITHUB_TOKEN", "NEON_API_KEY", "VERCEL_TOKEN"]'::jsonb,
  '{"tags": ["deployment", "full-stack", "github", "neon", "vercel"]}'::jsonb
);

-- RAD Crawler + Context Engine Indexing
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'Knowledge Base Indexing',
  'Index a repository into RAD crawler and Context Engine for semantic search',
  'analysis',
  '[
    {"id": "register_source", "tool": "rad_register_source", "params": {}, "dependencies": []},
    {"id": "trigger_crawl", "tool": "rad_trigger_crawl", "params": {}, "dependencies": ["register_source"]},
    {"id": "index_repo", "tool": "context_index_repo", "params": {"force": true}, "dependencies": ["trigger_crawl"]}
  ]'::jsonb,
  '["RAD_DATABASE_URL"]'::jsonb,
  '{"tags": ["indexing", "knowledge-base", "rad", "context-engine"]}'::jsonb
);

-- Batch Anthropic Analysis
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'Batch Document Analysis',
  'Analyze large document sets using Anthropic batch API (Paid Agent)',
  'analysis',
  '[
    {"id": "collect_docs", "tool": "rad_preview_documents", "params": {}, "dependencies": []},
    {"id": "create_batch", "tool": "paid_agent_batch_create", "params": {}, "dependencies": ["collect_docs"]},
    {"id": "check_status", "tool": "paid_agent_batch_status", "params": {}, "dependencies": ["create_batch"]},
    {"id": "get_results", "tool": "paid_agent_batch_results", "params": {}, "dependencies": ["check_status"]}
  ]'::jsonb,
  '["ANTHROPIC_API_KEY"]'::jsonb,
  '{"tags": ["analysis", "batch", "anthropic", "documents"]}'::jsonb
);

-- ============================================================================
-- CODE PATTERNS
-- ============================================================================

-- MCP Handler Template
INSERT INTO code_patterns (name, description, pattern_type, language, template, variables, tags, metadata)
VALUES (
  'MCP Tool Handler',
  'Standard MCP tool handler with error handling and validation',
  'mcp_handler',
  'typescript',
  'export async function {{toolName}}(args: {{ArgsType}}): Promise<{{ReturnType}}> {
  try {
    // Validate inputs
    if (!args.{{requiredField}}) {
      throw new Error(''{{requiredField}} is required'');
    }

    // Execute tool logic
    const result = await {{implementation}};

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}',
  '[
    {"name": "toolName", "type": "string", "description": "Tool function name"},
    {"name": "ArgsType", "type": "string", "description": "Arguments type name"},
    {"name": "ReturnType", "type": "string", "description": "Return type name"},
    {"name": "requiredField", "type": "string", "description": "Required field to validate"},
    {"name": "implementation", "type": "string", "description": "Tool implementation code"}
  ]'::jsonb,
  ARRAY['mcp', 'handler', 'typescript', 'error-handling'],
  '{"complexity": "simple"}'::jsonb
);

-- Toolkit Category Handler
INSERT INTO code_patterns (name, description, pattern_type, language, template, variables, tags, metadata)
VALUES (
  'Toolkit Category Handler',
  'Robinson''s Toolkit category handler with broker pattern',
  'toolkit_handler',
  'typescript',
  'import { ToolkitClient } from ''../shared/toolkit-client.js'';

export async function {{categoryName}}_{{actionName}}(args: any): Promise<any> {
  const client = new ToolkitClient();

  try {
    const result = await client.call(''{{categoryName}}'', ''{{toolName}}'', args);
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}',
  '[
    {"name": "categoryName", "type": "string", "description": "Category name (e.g., github, neon, vercel)"},
    {"name": "actionName", "type": "string", "description": "Action name (e.g., create_repo, list_projects)"},
    {"name": "toolName", "type": "string", "description": "Full tool name"}
  ]'::jsonb,
  ARRAY['toolkit', 'handler', 'broker', 'typescript'],
  '{"complexity": "simple"}'::jsonb
);

-- RAD/Postgres Client Pattern
INSERT INTO code_patterns (name, description, pattern_type, language, template, variables, tags, metadata)
VALUES (
  'RAD Repository Pattern',
  'Repository pattern for RAD/Postgres with connection pooling',
  'client_pattern',
  'typescript',
  'import { Pool } from ''pg'';

export class {{RepositoryName}} {
  constructor(private pool: Pool) {}

  async {{methodName}}({{params}}): Promise<{{ReturnType}}> {
    const result = await this.pool.query(
      `{{sqlQuery}}`,
      [{{queryParams}}]
    );

    return result.rows.map(this.mapRow);
  }

  private mapRow(row: any): {{ReturnType}} {
    return {
      {{mappingLogic}}
    };
  }
}',
  '[
    {"name": "RepositoryName", "type": "string", "description": "Repository class name"},
    {"name": "methodName", "type": "string", "description": "Method name"},
    {"name": "params", "type": "string", "description": "Method parameters"},
    {"name": "ReturnType", "type": "string", "description": "Return type"},
    {"name": "sqlQuery", "type": "string", "description": "SQL query"},
    {"name": "queryParams", "type": "string", "description": "Query parameters"},
    {"name": "mappingLogic", "type": "string", "description": "Row mapping logic"}
  ]'::jsonb,
  ARRAY['repository', 'postgres', 'rad', 'typescript'],
  '{"complexity": "medium"}'::jsonb
);

-- Robust Error Wrapper
INSERT INTO code_patterns (name, description, pattern_type, language, template, variables, tags, metadata)
VALUES (
  'Robust Error Wrapper',
  'Error handling wrapper with retry logic and logging',
  'error_wrapper',
  'typescript',
  'export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, onError } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (onError) {
        onError(error as Error, attempt);
      }

      if (attempt === maxRetries) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw new Error(''Unreachable'');
}',
  '[]'::jsonb,
  ARRAY['error-handling', 'retry', 'typescript', 'utility']::text[],
  '{"complexity": "simple"}'::jsonb
);

-- ============================================================================
-- CAPABILITY REGISTRY
-- ============================================================================

-- Provision Production Database
INSERT INTO capability_registry (name, description, category, required_tools, required_env_vars, complexity, estimated_duration_minutes, metadata)
VALUES (
  'Provision Production Database',
  'Create and configure a production-ready Neon Postgres database',
  'infrastructure',
  ARRAY['neon_create_project', 'neon_create_branch', 'neon_get_connection_string'],
  ARRAY['NEON_API_KEY'],
  'medium',
  10,
  '{"tags": ["database", "neon", "infrastructure"]}'::jsonb
);

-- Deploy Web Service
INSERT INTO capability_registry (name, description, category, required_tools, required_env_vars, complexity, estimated_duration_minutes, metadata)
VALUES (
  'Deploy Web Service',
  'Deploy a web application to Vercel with environment variables',
  'deployment',
  ARRAY['vercel_deploy', 'vercel_set_env_vars', 'vercel_get_deployment_status'],
  ARRAY['VERCEL_TOKEN'],
  'medium',
  15,
  '{"tags": ["deployment", "vercel", "web"]}'::jsonb
);

-- Index Knowledge Base
INSERT INTO capability_registry (name, description, category, required_tools, required_env_vars, complexity, estimated_duration_minutes, metadata)
VALUES (
  'Index Knowledge Base',
  'Index a repository into RAD crawler and Context Engine for semantic search',
  'analysis',
  ARRAY['rad_register_source', 'rad_trigger_crawl', 'context_index_repo'],
  ARRAY['RAD_DATABASE_URL'],
  'simple',
  5,
  '{"tags": ["indexing", "knowledge-base", "rad"]}'::jsonb
);

-- Run Repo-wide Code Review
INSERT INTO capability_registry (name, description, category, required_tools, required_env_vars, complexity, estimated_duration_minutes, metadata)
VALUES (
  'Run Repo-wide Code Review',
  'Perform comprehensive code review using Context Engine and Thinking Tools',
  'analysis',
  ARRAY['context_smart_query', 'framework_critical_thinking', 'framework_red_team']::text[],
  ARRAY[]::text[],
  'complex',
  30,
  '{"tags": ["code-review", "analysis", "quality"]}'::jsonb
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT
  'thinking_playbooks' as table_name,
  COUNT(*) as record_count
FROM thinking_playbooks
UNION ALL
SELECT
  'tool_workflows',
  COUNT(*)
FROM tool_workflows
UNION ALL
SELECT
  'code_patterns',
  COUNT(*)
FROM code_patterns
UNION ALL
SELECT
  'capability_registry',
  COUNT(*)
FROM capability_registry
ORDER BY table_name;


