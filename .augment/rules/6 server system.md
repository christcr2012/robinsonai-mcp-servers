---
type: "agent_requested"
description: "Example description"
---

SYSTEM // Robinson 6-Server Orchestration (Do this every time)

CORE ROLES
- architect-mcp → planning ONLY. Produce {plan_id}. Never run tools directly.
- credit-optimizer-mcp → run workflows from Architect plans. Takes {workflow_id}.
- autonomous-agent-mcp → heavy code & refactors locally (Ollama). Opens PRs via Toolkit.
- thinking-tools-mcp → decomposition/spec/risk/templates; no file edits.
- openai-worker-mcp → escalation ONLY for hard reasoning or quality (cost-aware).
- robinsons-toolkit-mcp → broker/proxy for all integrations (GitHub, Vercel, Neon, Redis, Playwright, Context7, Google Workspace, Stripe, Supabase, Resend, Twilio, Cloudflare, Fly, Redis Cloud, OpenAI, Sequential Thinking).

GOLDEN PATH
1) PLAN
   - Call architect-mcp.plan_work({ intent, constraints }) → returns {plan_id}.
   - Poll with architect-mcp.get_plan_status / get_plan_chunk until complete.
   - Validate plan size; if long, ask architect for chunked plan (no giant JSON).
2) EXPORT
   - Call architect-mcp.export_workplan_to_optimizer({ plan_id }) → {workflow_id}.
3) EXECUTE
   - Call credit-optimizer-mcp.execute_autonomous_workflow({ workflow_id }).
   - Optimizer calls concrete MCP tools; NO loops of “continue” in chat.
4) INTEGRATIONS (APIs, repos, deploys)
   - Always use robinsons-toolkit-mcp.broker_call({ server, tool, args }).
   - Do not run shell git or curl. Use GitHub/Vercel/Neon/etc via broker.
5) CODE CHANGES
   - For creating/editing files: delegate to autonomous-agent-mcp (Ollama).
   - Use Toolkit→GitHub through broker to open PRs (e.g., open_pr_with_changes).
6) THINKING/SCOPING
   - Use thinking-tools-mcp for break-down, spec, risks, acceptance tests.
7) ESCALATION POLICY (cost control)
   - Default to Ollama (autonomous-agent-mcp).
   - Escalate to openai-worker-mcp only if: critical user-facing copy, complex multi-file design, or failed twice with Ollama; ask for confirmation if likely >$1.
8) HANDLES, NOT BLOBS
   - Return only {plan_id}, {workflow_id}, {job_id}, {pr_url}. Fetch details when needed.
9) HEALTH/DEBUG
   - If a tool is missing/slow: robinsons-toolkit-mcp.diagnose_environment, then broker_stats.
10) NEVER DO
   - Don’t directly edit repo files in chat.
   - Don’t call integration MCPs directly; always go through the Toolkit broker.
   - Don’t bypass Architect for multi-step work.

QUICK COMMAND EXAMPLES
- Plan: architect-mcp.plan_work({ intent:"<goal>", constraints:{max_files_changed:20, depth:"fast"} })
- Export: architect-mcp.export_workplan_to_optimizer({ plan_id })
- Execute: credit-optimizer-mcp.execute_autonomous_workflow({ workflow_id })
- Broker tool: robinsons-toolkit-mcp.broker_call({ server:"github-mcp", tool:"open_pr_with_changes", args:{...} })
- Delegate code: autonomous-agent-mcp.delegate_code_generation({ goal:"...", files:[...] })