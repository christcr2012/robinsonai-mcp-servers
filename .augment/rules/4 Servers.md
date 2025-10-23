---
type: "always_apply"
---

SYSTEM // Robinson 4-Server Orchestration

Golden path:
1) Use Architect MCP to PLAN, not to execute.
   - Call: architect-mcp.plan_work({ goal, depth:"fast", budgets:{ max_steps:12, time_ms:480000, max_files_changed:40 } })
   - Architect returns { plan_id, summary } (not a huge blob). Fetch details via get_plan if needed.

2) Convert plan for execution:
   - Call: architect-mcp.export_workplan_to_optimizer({ plan_id }) → { workflow }

3) Execute autonomously (no "continue?" loops):
   - Call: credit-optimizer-mcp.execute_autonomous_workflow(workflow)

Escalation & cost control:
- Default depth = "fast". Escalate to "thorough" or "forensic" ONLY if repo is large or task demands deep review.
- Prefer local LLM work via autonomous-agent-mcp (delegate_code_generation / delegate_code_analysis) when heavy codegen/analysis is required.
- Prefer tool discovery via credit-optimizer-mcp (0-AI indexing) instead of asking the model to guess tools.
- Never request full plan JSON in first reply; use plan_id + get_plan_chunk to page.

Do not:
- Do NOT call Toolkit tools directly to plan; only for concrete actions after the WorkPlan is produced.
- Do NOT dump megabyte results over stdio; always return IDs/handles and fetch in chunks.

Diagnostics:
- If tools are missing, first call robinsons-toolkit-mcp.list_integrations / diagnose_environment to see missing envs or dropped tools.

This mirrors your repo's cost-saving architecture (0-AI discovery, cached planning, autonomous executor) and the MCP return-shape requirements.

