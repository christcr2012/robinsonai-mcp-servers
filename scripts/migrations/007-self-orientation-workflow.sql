-- Migration 007: Self-Orientation Workflow
-- Add system_self_orientation workflow to tool_workflows table
-- This workflow helps agents orient themselves by gathering system meta-knowledge

INSERT INTO tool_workflows (
  workflow_key,
  title,
  description,
  category,
  steps,
  min_agent_tier,
  tags,
  scope,
  scope_repo_id
) VALUES (
  'system_self_orientation',
  'System Self-Orientation',
  'Helps agents orient themselves by gathering tool catalog, capabilities, and agent handbook. Produces an orientation summary for the current task/session.',
  'system',
  '[
    {
      "step": 1,
      "action": "call_tool",
      "tool": "system_get_tool_catalog",
      "description": "Retrieve complete tool catalog across all MCP servers",
      "params": {}
    },
    {
      "step": 2,
      "action": "call_tool",
      "tool": "system_get_capabilities",
      "description": "Retrieve all registered capabilities from Agent Cortex",
      "params": {}
    },
    {
      "step": 3,
      "action": "call_tool",
      "tool": "system_get_agent_handbook",
      "description": "Retrieve the latest Agent Handbook (if available)",
      "params": {}
    },
    {
      "step": 4,
      "action": "synthesize",
      "description": "Synthesize orientation summary from gathered information",
      "output": "orientation_summary"
    },
    {
      "step": 5,
      "action": "save_artifact",
      "artifact_type": "thinking_output",
      "title": "System Orientation Summary",
      "tags": ["orientation", "system_overview", "meta"],
      "description": "Save orientation summary as knowledge artifact for future reference"
    }
  ]'::jsonb,
  'any',
  ARRAY['orientation', 'system', 'meta', 'introspection'],
  'global',
  NULL
)
ON CONFLICT (workflow_key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  steps = EXCLUDED.steps,
  min_agent_tier = EXCLUDED.min_agent_tier,
  tags = EXCLUDED.tags,
  scope = EXCLUDED.scope,
  scope_repo_id = EXCLUDED.scope_repo_id;

