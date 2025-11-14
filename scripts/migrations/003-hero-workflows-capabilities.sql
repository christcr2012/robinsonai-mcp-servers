-- ============================================================================
-- HERO WORKFLOWS & CAPABILITIES
-- Implements three high-level capabilities + workflows using RAD, Cortex, and Toolkit
-- ============================================================================

-- ============================================================================
-- CAPABILITY 1: RAD Repo Refactor and Migration
-- ============================================================================

INSERT INTO capability_registry (
  name, description, category, required_tools, required_env_vars,
  complexity, estimated_duration_minutes, metadata
)
VALUES (
  'RAD Repo Refactor and Migration',
  'Index a repository, analyze patterns, plan refactoring, and execute migration using RAD Crawler + Cortex',
  'refactoring',
  ARRAY[
    'rad_register_source', 'rad_trigger_crawl', 'rad_preview_documents',
    'context_smart_query', 'framework_systems_thinking', 'framework_decision_matrix',
    'free_agent_run_task_v2', 'paid_agent_run_task_v2'
  ]::text[],
  ARRAY['RAD_DATABASE_URL']::text[],
  'complex',
  120,
  jsonb_build_object(
    'tags', ARRAY['refactoring', 'migration', 'rad', 'cortex'],
    'preferred_workflows', ARRAY['rad_index_repo', 'rad_refactor_plan', 'rad_refactor_execute'],
    'default_agent_tier', 'paid',
    'risk_level', 'high'
  )
);

-- Workflow 1: RAD Index Repo
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'RAD Index Repo',
  'Register and index a repository into RAD Crawler for analysis',
  'analysis',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'register_source',
      'tool', 'rad_register_source',
      'params', jsonb_build_object(
        'name', '{{repo_name}}',
        'sourceType', 'git_repo',
        'config', jsonb_build_object('repoUrl', '{{repo_url}}')
      ),
      'dependencies', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 'trigger_crawl',
      'tool', 'rad_trigger_crawl',
      'params', jsonb_build_object('sourceId', '{{source_id}}'),
      'dependencies', jsonb_build_array('register_source')
    ),
    jsonb_build_object(
      'id', 'verify_index',
      'tool', 'rad_get_crawl_summary',
      'params', jsonb_build_object('sourceId', '{{source_id}}'),
      'dependencies', jsonb_build_array('trigger_crawl')
    )
  ),
  ARRAY['RAD_DATABASE_URL']::jsonb,
  jsonb_build_object(
    'tags', ARRAY['indexing', 'rad', 'analysis']
  )
);

-- Workflow 2: RAD Refactor Plan
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'RAD Refactor Plan',
  'Analyze indexed repository and create refactoring plan using Thinking Tools',
  'planning',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'analyze_patterns',
      'tool', 'context_smart_query',
      'params', jsonb_build_object('question', '{{refactor_goal}}'),
      'dependencies', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 'systems_analysis',
      'tool', 'framework_systems_thinking',
      'params', jsonb_build_object('problem', '{{refactor_goal}}'),
      'dependencies', jsonb_build_array('analyze_patterns')
    ),
    jsonb_build_object(
      'id', 'decision_matrix',
      'tool', 'framework_decision_matrix',
      'params', jsonb_build_object('problem', 'Choose refactoring approach'),
      'dependencies', jsonb_build_array('systems_analysis')
    )
  ),
  ARRAY[]::jsonb,
  jsonb_build_object(
    'tags', ARRAY['planning', 'refactoring', 'thinking-tools']
  )
);

-- Workflow 3: RAD Refactor Execute
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'RAD Refactor Execute',
  'Execute refactoring plan using Paid Agent with quality gates',
  'execution',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'execute_refactor',
      'tool', 'paid_agent_run_task_v2',
      'params', jsonb_build_object(
        'repo', '{{repo_path}}',
        'task', '{{refactor_plan}}',
        'kind', 'refactor',
        'quality', 'best'
      ),
      'dependencies', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 'verify_changes',
      'tool', 'framework_blue_team',
      'params', jsonb_build_object('problem', 'Verify refactoring safety'),
      'dependencies', jsonb_build_array('execute_refactor')
    )
  ),
  ARRAY['ANTHROPIC_API_KEY']::jsonb,
  jsonb_build_object(
    'tags', ARRAY['execution', 'refactoring', 'paid-agent']
  )
);




-- ============================================================================
-- CAPABILITY 2: Bootstrap Agent Cortex
-- ============================================================================

INSERT INTO capability_registry (
  name, description, category, required_tools, required_env_vars,
  complexity, estimated_duration_minutes, metadata
)
VALUES (
  'Bootstrap Agent Cortex',
  'Index all RAD sources, extract patterns from codebase, and generate Agent Handbook',
  'system',
  ARRAY[
    'rad_list_sources', 'rad_trigger_crawl', 'context_index_repo',
    'framework_systems_thinking', 'paid_agent_run_task_v2'
  ]::text[],
  ARRAY['RAD_DATABASE_URL', 'ANTHROPIC_API_KEY']::text[],
  'expert',
  180,
  jsonb_build_object(
    'tags', ARRAY['bootstrap', 'cortex', 'system', 'handbook'],
    'preferred_workflows', ARRAY['rad_index_all_sources', 'cortex_extract_patterns', 'cortex_generate_handbook'],
    'default_agent_tier', 'paid',
    'risk_level', 'medium'
  )
);

-- Workflow 4: RAD Index All Sources
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'RAD Index All Sources',
  'Trigger crawls for all enabled RAD sources',
  'indexing',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'list_sources',
      'tool', 'rad_list_sources',
      'params', jsonb_build_object('enabled', true),
      'dependencies', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 'trigger_crawls',
      'tool', 'rad_trigger_crawl',
      'params', jsonb_build_object('sourceId', '{{source_ids}}'),
      'dependencies', jsonb_build_array('list_sources')
    ),
    jsonb_build_object(
      'id', 'index_context',
      'tool', 'context_index_repo',
      'params', jsonb_build_object('force', true),
      'dependencies', jsonb_build_array('trigger_crawls')
    )
  ),
  ARRAY['RAD_DATABASE_URL']::jsonb,
  jsonb_build_object(
    'tags', ARRAY['indexing', 'rad', 'context-engine']
  )
);

-- Workflow 5: Cortex Extract Patterns
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'Cortex Extract Patterns',
  'Extract code patterns, workflows, and capabilities from indexed codebase',
  'analysis',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'analyze_codebase',
      'tool', 'context_smart_query',
      'params', jsonb_build_object('question', 'Find all MCP handlers, tool definitions, and workflow patterns'),
      'dependencies', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 'extract_patterns',
      'tool', 'paid_agent_run_task_v2',
      'params', jsonb_build_object(
        'repo', '{{repo_path}}',
        'task', 'Extract code patterns and save to Cortex',
        'kind', 'analysis'
      ),
      'dependencies', jsonb_build_array('analyze_codebase')
    )
  ),
  ARRAY['ANTHROPIC_API_KEY']::jsonb,
  jsonb_build_object(
    'tags', ARRAY['analysis', 'cortex', 'patterns']
  )
);

-- Workflow 6: Cortex Generate Handbook
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'Cortex Generate Handbook',
  'Generate comprehensive Agent Handbook from Cortex knowledge',
  'documentation',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'gather_knowledge',
      'tool', 'framework_systems_thinking',
      'params', jsonb_build_object('problem', 'Organize system knowledge into handbook'),
      'dependencies', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 'generate_handbook',
      'tool', 'paid_agent_run_task_v2',
      'params', jsonb_build_object(
        'repo', '{{repo_path}}',
        'task', 'Generate Agent Handbook from Cortex data and save as knowledge artifact',
        'kind', 'docs'
      ),
      'dependencies', jsonb_build_array('gather_knowledge')
    )
  ),
  ARRAY['ANTHROPIC_API_KEY']::jsonb,
  jsonb_build_object(
    'tags', ARRAY['documentation', 'handbook', 'cortex']
  )
);


-- ============================================================================
-- CAPABILITY 3: Incident Root Cause and Fix
-- ============================================================================

INSERT INTO capability_registry (
  name, description, category, required_tools, required_env_vars,
  complexity, estimated_duration_minutes, metadata
)
VALUES (
  'Incident Root Cause and Fix',
  'Triage incident, perform root cause analysis, implement fix, and record lessons learned',
  'incident',
  ARRAY[
    'context_smart_query', 'framework_root_cause', 'framework_premortem',
    'framework_blue_team', 'paid_agent_run_task_v2'
  ]::text[],
  ARRAY['ANTHROPIC_API_KEY']::text[],
  'complex',
  90,
  jsonb_build_object(
    'tags', ARRAY['incident', 'debugging', 'root-cause', 'lessons'],
    'preferred_workflows', ARRAY['incident_triage', 'incident_fix', 'incident_lesson'],
    'default_agent_tier', 'paid',
    'risk_level', 'high'
  )
);

-- Workflow 7: Incident Triage
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'Incident Triage',
  'Gather context and perform initial root cause analysis',
  'incident',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'gather_context',
      'tool', 'context_smart_query',
      'params', jsonb_build_object('question', '{{incident_description}}'),
      'dependencies', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 'root_cause',
      'tool', 'framework_root_cause',
      'params', jsonb_build_object('problem', '{{incident_description}}'),
      'dependencies', jsonb_build_array('gather_context')
    ),
    jsonb_build_object(
      'id', 'premortem',
      'tool', 'framework_premortem',
      'params', jsonb_build_object('project', 'Incident fix'),
      'dependencies', jsonb_build_array('root_cause')
    )
  ),
  ARRAY[]::jsonb,
  jsonb_build_object(
    'tags', ARRAY['incident', 'triage', 'root-cause']
  )
);

-- Workflow 8: Incident Fix
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'Incident Fix',
  'Implement fix with safety checks and verification',
  'incident',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'implement_fix',
      'tool', 'paid_agent_run_task_v2',
      'params', jsonb_build_object(
        'repo', '{{repo_path}}',
        'task', '{{fix_plan}}',
        'kind', 'bugfix',
        'quality', 'best'
      ),
      'dependencies', '[]'::jsonb
    ),
    jsonb_build_object(
      'id', 'verify_fix',
      'tool', 'framework_blue_team',
      'params', jsonb_build_object('problem', 'Verify incident fix safety'),
      'dependencies', jsonb_build_array('implement_fix')
    )
  ),
  ARRAY['ANTHROPIC_API_KEY']::jsonb,
  jsonb_build_object(
    'tags', ARRAY['incident', 'fix', 'verification']
  )
);

-- Workflow 9: Incident Lesson
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'Incident Lesson',
  'Record lessons learned and update Cortex knowledge',
  'learning',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'document_lesson',
      'tool', 'paid_agent_run_task_v2',
      'params', jsonb_build_object(
        'repo', '{{repo_path}}',
        'task', 'Document incident lessons and save to Cortex as knowledge artifact',
        'kind', 'docs'
      ),
      'dependencies', '[]'::jsonb
    )
  ),
  ARRAY['ANTHROPIC_API_KEY']::jsonb,
  jsonb_build_object(
    'tags', ARRAY['incident', 'lessons', 'documentation']
  )
);
