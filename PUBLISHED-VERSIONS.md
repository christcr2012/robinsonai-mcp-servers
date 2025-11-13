# Published MCP Server Versions

Last updated: 2025-01-13

## 🎉 Latest Published Versions

### Free Agent MCP
- **Version:** 0.8.0
- **Published:** 2025-01-13
- **npm:** `@robinson_ai_systems/free-agent-mcp@0.8.0`
- **Changes:**
  - ✅ Section 2.1: Design the One True Entry Tool (free_agent_run_task)
  - ✅ Section 2.2: Make Repo Adapters Just Work (PCE, auto-discovery)
  - ✅ Section 2.3: Tighten the Coding Loop (quality gates pipeline)
  - ✅ Section 2.4: Hard 'Free-first, Paid-when-needed' Policy (cost guards)
  - ✅ Context Engine integration with detectContextQuery
  - ✅ Moonshot/Kimi K2 model support

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

