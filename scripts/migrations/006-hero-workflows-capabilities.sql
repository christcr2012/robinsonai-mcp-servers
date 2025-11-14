-- Migration 006: Hero Workflows & Capabilities
-- Implements three high-level capabilities with corresponding workflows
-- Date: 2025-01-14

-- ============================================================================
-- CAPABILITY 1: RAD Repo Refactor and Migration
-- ============================================================================
INSERT INTO capability_registry (
  name, description, category, required_tools, required_env_vars,
  complexity, estimated_duration_minutes, scope, metadata
) VALUES (
  'rad_repo_refactor_and_migration',
  'Index repository with RAD, analyze patterns, plan and execute safe refactoring or migration',
  'infrastructure',
  ARRAY['rad_index_repo', 'rad_refactor_plan', 'rad_refactor_execute', 'free_agent_run_task_v2', 'paid_agent_run_task_v2'],
  ARRAY['RAD_DB_URL'],
  'expert',
  120,
  'global',
  '{"preferred_workflows": ["rad_index_repo", "rad_refactor_plan", "rad_refactor_execute"], "preferred_tools": ["rad_*", "free_agent_*", "paid_agent_*"], "default_agent_tier": "paid", "risk_level": "high", "tags": ["rad", "refactor", "migration", "analysis"]}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- CAPABILITY 2: Bootstrap Agent Cortex
-- ============================================================================
INSERT INTO capability_registry (
  name, description, category, required_tools, required_env_vars,
  complexity, estimated_duration_minutes, scope, metadata
) VALUES (
  'bootstrap_agent_cortex',
  'Index all knowledge sources (code, docs, web), extract patterns, and generate comprehensive agent handbook',
  'analysis',
  ARRAY['rad_index_all_sources', 'cortex_extract_patterns', 'cortex_generate_handbook', 'context_index_repo', 'context_web_search'],
  ARRAY['RAD_DB_URL', 'CORTEX_DB_URL'],
  'expert',
  180,
  'global',
  '{"preferred_workflows": ["rad_index_all_sources", "cortex_extract_patterns", "cortex_generate_handbook"], "preferred_tools": ["rad_*", "cortex_*", "context_*"], "default_agent_tier": "paid", "risk_level": "medium", "tags": ["cortex", "bootstrap", "knowledge", "handbook"]}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- CAPABILITY 3: Incident Root Cause and Fix
-- ============================================================================
INSERT INTO capability_registry (
  name, description, category, required_tools, required_env_vars,
  complexity, estimated_duration_minutes, scope, metadata
) VALUES (
  'incident_root_cause_and_fix',
  'Triage incident, perform root cause analysis, implement fix, and record lesson learned',
  'deployment',
  ARRAY['incident_triage', 'incident_fix', 'incident_lesson', 'framework_root_cause', 'framework_premortem'],
  ARRAY['RAD_DB_URL'],
  'complex',
  90,
  'global',
  '{"preferred_workflows": ["incident_triage", "incident_fix", "incident_lesson"], "preferred_tools": ["framework_root_cause", "framework_premortem", "framework_blue_team"], "default_agent_tier": "paid", "risk_level": "high", "tags": ["incident", "debugging", "root-cause", "fix"]}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- WORKFLOW 1: RAD Index Repo
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'rad_index_repo',
  'Index repository with RAD crawler for pattern analysis',
  'infrastructure',
  '[
    {"id": "register_source", "tool": "rad_register_source", "params": {"sourceType": "git_repo", "config": {"repoUrl": "{{repo_url}}", "branch": "{{branch}}"}}, "dependencies": []},
    {"id": "trigger_crawl", "tool": "rad_trigger_crawl", "params": {"sourceId": "{{source_id}}"}, "dependencies": ["register_source"]},
    {"id": "wait_completion", "tool": "rad_get_crawl_status", "params": {"crawlId": "{{crawl_id}}"}, "dependencies": ["trigger_crawl"]}
  ]'::jsonb,
  '["RAD_DB_URL"]'::jsonb,
  'global',
  '{"min_agent_tier": "any", "estimated_time_minutes": 15}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();

-- ============================================================================
-- WORKFLOW 2: RAD Refactor Plan
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'rad_refactor_plan',
  'Analyze RAD index and create refactoring plan using thinking tools',
  'infrastructure',
  '[
    {"id": "query_patterns", "tool": "rad_query_documents", "params": {"keywords": ["{{refactor_target}}"], "limit": 50}, "dependencies": []},
    {"id": "analyze_risks", "tool": "framework_red_team", "params": {"problem": "Refactoring {{refactor_target}}", "context": "{{patterns}}"}, "dependencies": ["query_patterns"]},
    {"id": "create_plan", "tool": "framework_blue_team", "params": {"problem": "Safe refactoring strategy for {{refactor_target}}", "context": "{{risks}}"}, "dependencies": ["analyze_risks"]},
    {"id": "decision_matrix", "tool": "framework_decision_matrix", "params": {"problem": "Choose refactoring approach", "context": "{{plan}}"}, "dependencies": ["create_plan"]}
  ]'::jsonb,
  '["RAD_DB_URL"]'::jsonb,
  'global',
  '{"min_agent_tier": "paid", "estimated_time_minutes": 30}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();

-- ============================================================================
-- WORKFLOW 3: RAD Refactor Execute
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'rad_refactor_execute',
  'Execute refactoring plan using Free or Paid Agent',
  'infrastructure',
  '[
    {"id": "execute_refactor", "tool": "paid_agent_run_task", "params": {"task": "{{refactor_plan}}", "repo_path": "{{repo_path}}", "quality": "best", "run_tests": true}, "dependencies": []},
    {"id": "verify_tests", "tool": "paid_agent_run_task", "params": {"task": "Run all tests and verify no regressions", "repo_path": "{{repo_path}}"}, "dependencies": ["execute_refactor"]},
    {"id": "record_lesson", "tool": "rad_record_lesson", "params": {"taskId": "{{task_id}}", "lessonType": "success", "title": "Refactoring completed", "description": "{{summary}}"}, "dependencies": ["verify_tests"]}
  ]'::jsonb,
  '["RAD_DB_URL"]'::jsonb,
  'global',
  '{"min_agent_tier": "paid", "estimated_time_minutes": 60}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();

-- ============================================================================
-- WORKFLOW 4: RAD Index All Sources
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'rad_index_all_sources',
  'Index code, documentation, and web sources for Agent Cortex bootstrap',
  'analysis',
  '[
    {"id": "index_repo", "tool": "context_index_repo", "params": {}, "dependencies": []},
    {"id": "index_docs", "tool": "rad_register_source", "params": {"sourceType": "filesystem", "config": {"path": "{{docs_path}}"}}, "dependencies": []},
    {"id": "web_research", "tool": "context_web_search_and_import", "params": {"query": "{{tech_stack}} best practices", "k": 20}, "dependencies": []},
    {"id": "wait_indexing", "tool": "context_stats", "params": {}, "dependencies": ["index_repo", "index_docs", "web_research"]}
  ]'::jsonb,
  '["RAD_DB_URL"]'::jsonb,
  'global',
  '{"min_agent_tier": "any", "estimated_time_minutes": 30}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();

-- ============================================================================
-- WORKFLOW 5: Cortex Extract Patterns
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'cortex_extract_patterns',
  'Extract code patterns, workflows, and capabilities from indexed sources',
  'analysis',
  '[
    {"id": "query_code_patterns", "tool": "context_query", "params": {"query": "code patterns templates handlers", "top_k": 50}, "dependencies": []},
    {"id": "query_workflows", "tool": "context_query", "params": {"query": "workflows automation deployment", "top_k": 50}, "dependencies": []},
    {"id": "analyze_patterns", "tool": "paid_agent_run_task", "params": {"task": "Analyze code patterns and extract reusable templates", "repo_path": "{{repo_path}}"}, "dependencies": ["query_code_patterns"]},
    {"id": "store_patterns", "tool": "cortex_store_patterns", "params": {"patterns": "{{extracted_patterns}}"}, "dependencies": ["analyze_patterns"]}
  ]'::jsonb,
  '["CORTEX_DB_URL"]'::jsonb,
  'global',
  '{"min_agent_tier": "paid", "estimated_time_minutes": 45}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();

-- ============================================================================
-- WORKFLOW 6: Cortex Generate Handbook
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'cortex_generate_handbook',
  'Generate comprehensive Agent Handbook from all knowledge sources',
  'analysis',
  '[
    {"id": "gather_capabilities", "tool": "system_get_capabilities", "params": {}, "dependencies": []},
    {"id": "gather_tools", "tool": "system_get_tool_catalog", "params": {}, "dependencies": []},
    {"id": "gather_patterns", "tool": "cortex_get_patterns", "params": {"scope": "global"}, "dependencies": []},
    {"id": "generate_handbook", "tool": "paid_agent_run_task", "params": {"task": "Generate comprehensive Agent Handbook covering capabilities, tools, patterns, and workflows", "repo_path": "{{repo_path}}"}, "dependencies": ["gather_capabilities", "gather_tools", "gather_patterns"]},
    {"id": "store_handbook", "tool": "cortex_store_artifact", "params": {"artifactType": "agent_handbook", "title": "Agent Handbook", "content": "{{handbook}}", "tags": ["handbook", "system_overview"]}, "dependencies": ["generate_handbook"]}
  ]'::jsonb,
  '["CORTEX_DB_URL"]'::jsonb,
  'global',
  '{"min_agent_tier": "paid", "estimated_time_minutes": 60}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();

-- ============================================================================
-- WORKFLOW 7: Incident Triage
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'incident_triage',
  'Triage incident and gather evidence for root cause analysis',
  'deployment',
  '[
    {"id": "gather_logs", "tool": "context_query", "params": {"query": "error exception failure {{incident_keywords}}", "top_k": 30}, "dependencies": []},
    {"id": "gather_recent_changes", "tool": "context_summarize_diff", "params": {"range": "HEAD~10..HEAD"}, "dependencies": []},
    {"id": "initial_analysis", "tool": "framework_root_cause", "params": {"problem": "{{incident_description}}", "context": "{{logs_and_changes}}"}, "dependencies": ["gather_logs", "gather_recent_changes"]},
    {"id": "create_triage_report", "tool": "cortex_store_artifact", "params": {"artifactType": "plan", "title": "Incident Triage: {{incident_id}}", "content": "{{analysis}}", "tags": ["incident", "triage"]}, "dependencies": ["initial_analysis"]}
  ]'::jsonb,
  '[]'::jsonb,
  'global',
  '{"min_agent_tier": "any", "estimated_time_minutes": 20}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();


-- ============================================================================
-- WORKFLOW 8: Incident Fix
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'incident_fix',
  'Implement fix for incident based on root cause analysis',
  'deployment',
  '[
    {"id": "create_fix_plan", "tool": "framework_blue_team", "params": {"problem": "Fix for {{incident_description}}", "context": "{{root_cause}}"}, "dependencies": []},
    {"id": "implement_fix", "tool": "paid_agent_run_task", "params": {"task": "{{fix_plan}}", "repo_path": "{{repo_path}}", "quality": "best", "run_tests": true, "run_lint": true}, "dependencies": ["create_fix_plan"]},
    {"id": "verify_fix", "tool": "paid_agent_run_task", "params": {"task": "Verify incident is resolved and no regressions introduced", "repo_path": "{{repo_path}}"}, "dependencies": ["implement_fix"]},
    {"id": "create_fix_report", "tool": "cortex_store_artifact", "params": {"artifactType": "execution_summary", "title": "Incident Fix: {{incident_id}}", "content": "{{fix_summary}}", "tags": ["incident", "fix"]}, "dependencies": ["verify_fix"]}
  ]'::jsonb,
  '[]'::jsonb,
  'global',
  '{"min_agent_tier": "paid", "estimated_time_minutes": 45}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();

-- ============================================================================
-- WORKFLOW 9: Incident Lesson
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'incident_lesson',
  'Record lesson learned from incident for future prevention',
  'deployment',
  '[
    {"id": "analyze_prevention", "tool": "framework_premortem", "params": {"problem": "Prevent recurrence of {{incident_description}}", "context": "{{root_cause_and_fix}}"}, "dependencies": []},
    {"id": "record_lesson", "tool": "rad_record_lesson", "params": {"taskId": "{{task_id}}", "lessonType": "warning", "title": "Incident: {{incident_id}}", "description": "{{lesson_description}}", "tags": ["incident", "prevention"]}, "dependencies": ["analyze_prevention"]},
    {"id": "update_playbook", "tool": "cortex_update_playbook", "params": {"name": "playbook_debug_complex_bug", "additionalNotes": "{{prevention_measures}}"}, "dependencies": ["record_lesson"]}
  ]'::jsonb,
  '["RAD_DB_URL"]'::jsonb,
  'global',
  '{"min_agent_tier": "any", "estimated_time_minutes": 15}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();

-- ============================================================================
-- WORKFLOW 10: System Self Orientation
-- ============================================================================
INSERT INTO tool_workflows (
  name, description, category, steps, prerequisites, scope, metadata
) VALUES (
  'system_self_orientation',
  'Orient agent by gathering system capabilities, tools, and handbook',
  'analysis',
  '[
    {"id": "get_tool_catalog", "tool": "system_get_tool_catalog", "params": {}, "dependencies": []},
    {"id": "get_capabilities", "tool": "system_get_capabilities", "params": {}, "dependencies": []},
    {"id": "get_handbook", "tool": "system_get_agent_handbook", "params": {}, "dependencies": []},
    {"id": "create_orientation", "tool": "cortex_store_artifact", "params": {"artifactType": "thinking_output", "title": "System Orientation", "content": "{{orientation_summary}}", "tags": ["orientation", "system"]}, "dependencies": ["get_tool_catalog", "get_capabilities", "get_handbook"]}
  ]'::jsonb,
  '[]'::jsonb,
  'global',
  '{"min_agent_tier": "any", "estimated_time_minutes": 5}'::jsonb
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  steps = EXCLUDED.steps,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT
  'Capabilities' as type,
  name,
  category,
  scope
FROM capability_registry
WHERE name IN (
  'rad_repo_refactor_and_migration',
  'bootstrap_agent_cortex',
  'incident_root_cause_and_fix'
)
UNION ALL
SELECT
  'Workflows' as type,
  name,
  category,
  scope
FROM tool_workflows
WHERE name IN (
  'rad_index_repo',
  'rad_refactor_plan',
  'rad_refactor_execute',
  'rad_index_all_sources',
  'cortex_extract_patterns',
  'cortex_generate_handbook',
  'incident_triage',
  'incident_fix',
  'incident_lesson',
  'system_self_orientation'
)
ORDER BY type, name;


