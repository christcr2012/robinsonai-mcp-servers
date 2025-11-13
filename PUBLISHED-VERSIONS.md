# Published MCP Server Versions

Last updated: 2025-01-13

## 🎉 Latest Published Versions

### Free Agent MCP
- **Version:** 0.9.0 ⭐ NEW!
- **Published:** 2025-01-13 (second publish today)
- **npm:** `@robinson_ai_systems/free-agent-mcp@0.9.0`
- **Changes:**
  - ❌ **REMOVED:** `delegate_code_generation` (deprecated tool - use `free_agent_run` instead)
  - ✅ **ADDED:** `discover_thinking_tools_free-agent-mcp` (search thinking tools by keyword)
  - ✅ **ADDED:** `list_thinking_tools_free-agent-mcp` (list all 64 thinking tools)
  - 📊 **Tool Count:** 29 → 30 tools (removed 1, added 2)
  - 🎯 **Better Parity:** Both Free and Paid agents now have thinking tools discovery
- **Previous (0.8.0):**
  - Section 2.1-2.4 complete (free_agent_run_task, PCE, quality gates, cost guards)
  - Context Engine integration, Moonshot/Kimi K2 support

### Paid Agent MCP
- **Version:** 0.7.0
- **Published:** 2025-01-13
- **npm:** `@robinson_ai_systems/paid-agent-mcp@0.7.0`
- **Changes:**
  - 🎯 **FULL PARITY WITH FREE AGENT - ALL 20 TOOLS ADDED!**
  - ✅ File editing tools (5): file_str_replace, file_insert, file_save, file_delete, file_read
  - ✅ Delegate tools (5): delegate to FREE Ollama for cost optimization
  - ✅ Free Agent Core tools (5): free_agent_run, free_agent_smoke, run_parallel, paths_probe, generator_probe
  - ✅ Feedback system (2): submit_feedback, get_feedback_stats
  - ✅ Diagnostics tools (3): get_agent_stats, get_token_analytics, diagnose_paid_agent
  - ✅ Section 4.1: Align Paid Agent with Free Agent Pipeline (paid_agent_run_task)
  - ✅ Moonshot/Kimi K2 model support

### Thinking Tools MCP
- **Version:** 1.27.0
- **Published:** 2025-01-13
- **npm:** `@robinson_ai_systems/thinking-tools-mcp@1.27.0`
- **Changes:**
  - ✅ Section 3.1: Stabilize Thinking Tools MCP (73 frameworks, idle detection)
  - ✅ Section 3.2: Make Context Engine the One Obvious Entrypoint (context_smart_query)
  - ✅ Section 3.4: Fix & Use Context7 Bridge (shared caching, auto-import)
  - ✅ Performance optimizations (8s vs 180s timeout)

### Credit Optimizer MCP
- **Version:** 0.4.0
- **Published:** (stable, no changes)
- **npm:** `@robinson_ai_systems/credit-optimizer-mcp@0.4.0`

### Robinson's Toolkit MCP
- **Version:** 1.18.1
- **Published:** (stable, no changes)
- **npm:** `@robinson_ai_systems/robinsons-toolkit-mcp@1.18.1`

## 📝 Update Instructions

To use the latest versions, update your `augment-mcp-config.json`:

```json
{
  "mcpServers": {
    "Free Agent MCP": {
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/free-agent-mcp@0.8.0", "serve"]
    },
    "Paid Agent MCP": {
      "command": "pnpm.cmd",
      "args": ["dlx", "@robinson_ai_systems/paid-agent-mcp@0.7.0"]
    },
    "Thinking Tools MCP": {
      "command": "pnpm.cmd",
      "args": ["dlx", "@robinson_ai_systems/thinking-tools-mcp@1.27.0"]
    }
  }
}
```

Then reload MCP servers in Augment.

## 🚀 Key Achievements

- **Free Agent:** Fully operational 'Augment-killer' coding agent with FREE Ollama by default
- **Paid Agent:** Premium version with same capabilities, uses BEST PAID models by default
- **Both agents can:** delegate, edit files, generate code, run tests, learn from feedback
- **Moonshot/Kimi K2:** Integrated as DEFAULT REMOTE CODING MODEL (10-100x cheaper!)
- **Multi-agent coding stack:** PRODUCTION READY! 🚀

## 📊 Tool Count Summary

| MCP Server | Tool Count | Notes |
|------------|-----------|-------|
| **Free Agent MCP** | 30 | Removed 1 deprecated, added 2 thinking tools discovery |
| **Paid Agent MCP** | 39 | 10 extra tools (8 OpenAI-specific, 2 thinking tools discovery) |
| **Thinking Tools MCP** | 64+ | Cognitive frameworks + Context Engine |
| **Robinson's Toolkit MCP** | 1165+ | Unified broker for all integrations |
| **Credit Optimizer MCP** | 50+ | Cost optimization and workflow automation |

### Tools ONLY in Paid Agent (10 tools)

**OpenAI Worker Tools (8 tools - EXPECTED):**
1. `openai_worker_run_job`
2. `openai_worker_queue_batch`
3. `openai_worker_get_job_status`
4. `openai_worker_get_spend_stats`
5. `openai_worker_estimate_cost`
6. `openai_worker_get_capacity`
7. `openai_worker_refresh_pricing`
8. `openai_worker_get_token_analytics`

**Thinking Tools Discovery (2 tools - NOW IN BOTH):**
9. `discover_thinking_tools_paid-agent-mcp` ✅ (Free Agent now has `discover_thinking_tools_free-agent-mcp`)
10. `list_thinking_tools_paid-agent-mcp` ✅ (Free Agent now has `list_thinking_tools_free-agent-mcp`)

### Shared Tools (Both Agents Have These)

**Batch Execution & Debugging (3 tools):**
1. `run_parallel` - Run many free_agent_run jobs concurrently (NOT a debugging tool - it's for batch operations!)
2. `paths_probe` - Resolve repo + registry paths for debugging
3. `generator_probe` - Show which generator module resolves

