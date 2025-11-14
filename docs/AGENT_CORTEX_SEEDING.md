# Agent Cortex Seeding Guide

This document explains the initial seeding of Agent Cortex tables and how to extend them over time.

## Overview

Agent Cortex is the "brain" of the agent system, providing:
- **Thinking Playbooks**: Reusable thinking tool sequences for different task types
- **Tool Workflows**: Multi-step workflows combining Robinson's Toolkit tools
- **Code Patterns**: Reusable code templates and patterns
- **Capability Registry**: High-level capabilities that agents can perform

## Initial Seed Data

### Thinking Playbooks (4 total)

1. **Hot Bugfix** (Priority: 100)
   - Pattern: `(urgent|critical|hotfix|production.*down|p0|sev1)`
   - Tools: First Principles → Red Team → Decision Matrix
   - Use case: Fast-track critical bug fixes with minimal analysis

2. **Difficult Refactor** (Priority: 80)
   - Pattern: `(refactor|restructure|redesign|technical.*debt)`
   - Tools: First Principles → Systems Thinking → Premortem → Blue Team → Red Team → Decision Matrix
   - Use case: Comprehensive analysis for complex refactoring tasks

3. **New Feature - Unknown Impacts** (Priority: 70)
   - Pattern: `(new.*feature|implement|add.*functionality|unknown|unclear)`
   - Tools: First Principles → Scenario Planning → Premortem → SWOT → Decision Matrix
   - Use case: Thorough analysis for features with unclear scope or impacts

4. **Repo-wide Audit** (Priority: 60)
   - Pattern: `(audit|repo.*wide|codebase|migration|upgrade)`
   - Tools: Systems Thinking → SWOT → Premortem → Decision Matrix
   - Use case: Systematic analysis for repository-wide changes or audits

### Tool Workflows (3 total)

1. **Full Stack Deployment**
   - Category: deployment
   - Steps: Create GitHub repo → Create Neon database → Deploy to Vercel
   - Prerequisites: `GITHUB_TOKEN`, `NEON_API_KEY`, `VERCEL_TOKEN`

2. **Knowledge Base Indexing**
   - Category: analysis
   - Steps: Register RAD source → Trigger crawl → Index with Context Engine
   - Prerequisites: `RAD_DATABASE_URL`

3. **Batch Document Analysis**
   - Category: analysis
   - Steps: Collect docs → Create Anthropic batch → Check status → Get results
   - Prerequisites: `ANTHROPIC_API_KEY`

### Code Patterns (4 total)

1. **MCP Tool Handler**
   - Type: mcp_handler
   - Language: TypeScript
   - Variables: toolName, ArgsType, ReturnType, requiredField, implementation

2. **Toolkit Category Handler**
   - Type: toolkit_handler
   - Language: TypeScript
   - Variables: categoryName, actionName, toolName

3. **RAD Repository Pattern**
   - Type: client_pattern
   - Language: TypeScript
   - Variables: RepositoryName, methodName, params, ReturnType, sqlQuery, queryParams, mappingLogic

4. **Robust Error Wrapper**
   - Type: error_wrapper
   - Language: TypeScript
   - No variables (complete implementation)

### Capabilities (4 total)

1. **Provision Production Database**
   - Category: infrastructure
   - Complexity: medium
   - Duration: ~10 minutes
   - Tools: neon_create_project, neon_create_branch, neon_get_connection_string

2. **Deploy Web Service**
   - Category: deployment
   - Complexity: medium
   - Duration: ~15 minutes
   - Tools: vercel_deploy, vercel_set_env_vars, vercel_get_deployment_status

3. **Index Knowledge Base**
   - Category: analysis
   - Complexity: simple
   - Duration: ~5 minutes
   - Tools: rad_register_source, rad_trigger_crawl, context_index_repo

4. **Run Repo-wide Code Review**
   - Category: analysis
   - Complexity: complex
   - Duration: ~30 minutes
   - Tools: context_smart_query, framework_critical_thinking, framework_red_team

## How to Extend

### Adding New Playbooks

```sql
INSERT INTO thinking_playbooks (name, description, task_pattern, tool_sequence, priority, metadata)
VALUES (
  'Your Playbook Name',
  'Description of when to use this playbook',
  '(regex|pattern|to|match|tasks)',
  '[
    {"tool": "framework_name", "params": {"totalSteps": 5}},
    {"tool": "another_framework"}
  ]'::jsonb,
  50, -- Priority (higher = preferred)
  '{"tags": ["tag1", "tag2"]}'::jsonb
);
```

### Adding New Workflows

```sql
INSERT INTO tool_workflows (name, description, category, steps, prerequisites, metadata)
VALUES (
  'Your Workflow Name',
  'Description of what this workflow does',
  'category_name',
  '[
    {"id": "step1", "tool": "tool_name", "params": {}, "dependencies": []},
    {"id": "step2", "tool": "another_tool", "params": {}, "dependencies": ["step1"]}
  ]'::jsonb,
  '["ENV_VAR_1", "ENV_VAR_2"]'::jsonb,
  '{"tags": ["tag1", "tag2"]}'::jsonb
);
```

### Adding New Patterns

```sql
INSERT INTO code_patterns (name, description, pattern_type, language, template, variables, tags, metadata)
VALUES (
  'Your Pattern Name',
  'Description of this pattern',
  'pattern_type',
  'language',
  'Template code with {{variables}}',
  '[
    {"name": "variableName", "type": "string", "description": "What this variable is for"}
  ]'::jsonb,
  ARRAY['tag1', 'tag2']::text[],
  '{"complexity": "simple"}'::jsonb
);
```

### Adding New Capabilities

```sql
INSERT INTO capability_registry (name, description, category, required_tools, required_env_vars, complexity, estimated_duration_minutes, metadata)
VALUES (
  'Your Capability Name',
  'Description of what this capability does',
  'category_name',
  ARRAY['tool1', 'tool2']::text[],
  ARRAY['ENV_VAR']::text[],
  'medium', -- simple, medium, complex, expert
  20, -- Estimated duration in minutes
  '{"tags": ["tag1", "tag2"]}'::jsonb
);
```

## Running the Seeder

```bash
# Run the initial seeding
npx tsx scripts/run-cortex-seed.ts

# Or run the SQL directly
psql $RAD_DATABASE_URL -f scripts/migrations/002-agent-cortex-seed.sql
```

## Next Steps

1. **Test Cortex Integration**: Run a task and verify playbooks are matched correctly
2. **Monitor Usage**: Check `usage_count` and `success_rate` columns to see what's being used
3. **Add More Patterns**: As you build more code, extract patterns into the registry
4. **Implement Phase AC.5**: Add semantic search with pgvector for better matching

