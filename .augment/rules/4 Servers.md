---
type: "always_apply"
---

SYSTEM // Robinson 4-Server Orchestration (strict)

=== Goals ===
- Plan with Architect, execute with Credit Optimizer, call integrations via Robinson’s Toolkit, and offload heavy code work to Autonomous Agent (local Ollama) to keep cloud credits near zero.
- Never use terminal git; always use GitHub tools exposed through MCPs.
- Return small handles/IDs; fetch large results via getters to avoid megablobs over stdio.

=== Golden Path (every task) ===
1) PLAN (Architect)
   Call: architect-mcp.plan_work({
     goal, 
     depth: "fast", 
     budgets: { max_steps: 12, time_ms: 480000, max_files_changed: 40 }
   })
   → Expect: { plan_id, summary } only (no huge JSON).

2) EXPORT (Architect → Optimizer)
   Call: architect-mcp.export_workplan_to_optimizer({ plan_id })
   → Expect: { workflow } that Credit Optimizer can execute end-to-end.

3) EXECUTE (Optimizer, autonomous; no "continue?" loops)
   Call: credit-optimizer-mcp.execute_autonomous_workflow(workflow)

4) IN WORKFLOWS (tooling rules)
   - To interact with external services (GitHub/Vercel/Neon/etc.), prefer Optimizer steps that proxy via Robinson’s Toolkit. 
   - To generate/analyze/refactor code at scale, use autonomous-agent-mcp *inside* the workflow (local models) and produce **diffs**, not raw file overwrites.

=== Routing Rules (what to call when) ===
- Planning, critiques, ADRs → architect-mcp.* (plan_work, revise_plan, get_plan, get_plan_chunk)
- Running the plan / creating PRs / deployments → credit-optimizer-mcp.* 
- Discovering the right integration tool → credit-optimizer-mcp.discover_tools({ query, limit: 10 })  // 0-AI index
- Actual API calls (GitHub, Vercel, Neon…) → via Optimizer steps that use robinsons-toolkit-mcp under the hood
- Heavy codegen/analysis/tests → autonomous-agent-mcp.* (local Ollama; $0 cloud credits)

=== Git & PR Policy (NO terminal git) ===
- Never run shell git commands.
- For commits/branches/PRs use the MCP tools:
  • Use Optimizer’s PR tool (e.g., open_pr_with_changes) to create a branch, apply diff bundle, push, and open PR.
  • If unsure of the exact tool name, first: credit-optimizer-mcp.discover_tools({ query: "github pull request", limit: 5 })
- All write operations must be **patch/diff-first** and gated by tests (require_green_tests=true in the plan).

=== Cost & Safety Guardrails ===
- Default depth = "fast". Escalate to "thorough" or "forensic" only when the task is large or risky (migrations, security, multi-service changes).
- Architect plans only; never executes file writes or shell commands.
- Enforce caps in every plan/workflow: { max_files_changed ≤ 40, time_ms ≤ 8min, max_steps ≤ 12, require_green_tests = true } and include successSignals.
- Prefer local models via autonomous-agent-mcp for heavy thinking/generation to avoid cloud spend.
- Prefer 0-AI discovery (discover_tools, templates, caches) before making new LLM calls.

=== Output Size Policy ===
- First replies must be small. Return IDs/handles:
  • plan_id from Architect
  • workflow_id / job_id from Optimizer
- Use get_plan / get_plan_chunk / get_workflow_log to page large data.

=== Recovery / Diagnostics (when tools "go missing") ===
- Run: robinsons-toolkit-mcp.list_integrations and robinsons-toolkit-mcp.diagnose_environment
  → If an integration is missing, report required env vars and do not attempt the call until mounted.
- If Architect/Optimizer are slow: plan with depth:"fast", and fetch details via chunked getters. Avoid enumerating hundreds of tools in a single prompt.
- If a tool isn’t found: use credit-optimizer-mcp.discover_tools({ query:<keywords>, limit:10 }) then choose the best match.

=== Examples ===
// Plan → Export → Execute
const { plan_id } = await callTool("architect-mcp","plan_work",{ goal: "Complete remaining critical tasks", depth:"fast", budgets:{max_steps:12,time_ms:480000,max_files_changed:40}});
const { workflow } = await callTool("architect-mcp","export_workplan_to_optimizer",{ plan_id });
await callTool("credit-optimizer-mcp","execute_autonomous_workflow", workflow);

// Open a PR with diffs (never terminal git)
const prTool = await callTool("credit-optimizer-mcp","discover_tools",{ query:"github open pull request", limit:5 });
await callTool("credit-optimizer-mcp","open_pr_with_changes", { /* branch, title, description, diffBundle */ });

// Deploy preview
const deployTool = await callTool("credit-optimizer-mcp","discover_tools",{ query:"vercel preview", limit:5 });