# 6-Server MCP System - Complete Setup Guide

**Last Updated:** October 23, 2025  
**For:** Augment Code (Claude Sonnet 4.5)  
**Platform:** Windows (with macOS/Linux notes)

---

## Overview

This guide sets up a production-ready 6-server MCP architecture that saves 90%+ on AI costs by routing work to free local Ollama models while maintaining quality through strategic escalation to OpenAI when needed.

### The 6 Servers

1. **architect-mcp** - Strategic planning, specs, ADRs, cost forecasting
2. **autonomous-agent-mcp** - Local code generation, analysis, refactoring (FREE)
3. **openai-worker-mcp** - Paid OpenAI jobs with budget enforcement
4. **thinking-tools-mcp** - 15+ cognitive frameworks (devils advocate, SWOT, etc.)
5. **credit-optimizer-mcp** - Workflows, recipes, blueprints, caching
6. **robinsons-toolkit-mcp** - Broker for 1,197+ integration tools (GitHub, Vercel, Neon, etc.)

---

## Prerequisites

- **Node.js:** v20+ (tested with v22.19.0)
- **npm:** v10+ (tested with v11.6.2)
- **Ollama:** v0.12+ installed and running
- **VS Code:** Latest version
- **Augment Code:** Extension installed
- **Git:** For version control
- **Windows:** PowerShell 5.1+ (or macOS/Linux equivalent)

---

## Quick Start (5 Minutes)

### 1. Clone & Build
```bash
cd c:\Users\chris\Git Local\robinsonai-mcp-servers
npm ci
npm run build --workspaces --if-present
```

### 2. Pull Ollama Models
```bash
ollama pull qwen2.5:3b
ollama pull deepseek-coder:33b
ollama pull qwen2.5-coder:32b
```

### 3. Configure Augment
1. Open VS Code
2. Go to Settings → Tools → MCP Servers
3. Import `AUGMENT_6_SERVER_CONFIG_HARDENED.json`
4. Restart VS Code

### 4. Validate
Run the smoke test from `scripts/smoke-test-6-servers.md`

---

## Detailed Setup

### Step 1: Environment Configuration

The hardened config includes these safety guardrails:

**architect-mcp:**
- `ARCHITECT_MAX_STEPS: 8` - Limits planning complexity
- `ARCHITECT_PLANNER_TIME_MS: 45000` - 45s timeout per plan
- `ARCHITECT_PLANNER_SLICE_MS: 2000` - Incremental progress updates

**autonomous-agent-mcp:**
- `MAX_OLLAMA_CONCURRENCY: 2` - Conservative concurrency (increase if VRAM allows)

**openai-worker-mcp:**
- `MONTHLY_BUDGET: 25` - Hard $25/month limit
- `MAX_OPENAI_CONCURRENCY: 1` - One job at a time (prevents runaway costs)
- `PER_JOB_TOKEN_LIMIT: 6000` - Soft cap per job

**robinsons-toolkit-mcp:**
- `RTK_MAX_ACTIVE: 6` - Max 6 worker processes
- `RTK_IDLE_SECS: 300` - Kill idle workers after 5 minutes
- `RTK_TOOL_TIMEOUT_MS: 60000` - 60s timeout per tool call

### Step 2: Ollama Auto-Start (Windows)

Run as Administrator:
```powershell
.\scripts\setup-ollama-autostart.ps1
```

Or manually:
```powershell
$Action = New-ScheduledTaskAction -Execute "C:\Program Files\Ollama\ollama.exe" -Argument "serve"
$Trigger = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -TaskName "OllamaAutoStart" -Action $Action -Trigger $Trigger -RunLevel Highest -Force
```

**macOS:**
```bash
brew services start ollama
```

**Linux:**
```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Step 3: Integration Credentials

All credentials are pre-configured in `AUGMENT_6_SERVER_CONFIG_HARDENED.json`:

- ✅ GitHub (199 tools)
- ✅ Vercel (150 tools)
- ✅ Neon (145 tools)
- ✅ Stripe (105 tools)
- ✅ Google Workspace (120 tools)
- ✅ Fly.io (83 tools)
- ✅ Supabase (80 tools)
- ✅ Redis (80 tools)
- ✅ Cloudflare (78 tools)
- ✅ Twilio (60 tools)
- ✅ Resend (15 tools)
- ✅ Playwright (42 tools)

**Total:** 1,197 tools across 13 integrations

### Step 4: Validation

Run the comprehensive smoke test:
```
See scripts/smoke-test-6-servers.md for full test suite
```

Quick validation:
```
Use tool diagnose_autonomous_agent_autonomous-agent-mcp with {}
Use tool diagnose_environment_robinsons-toolkit-mcp with {}
Use tool get_credit_stats_credit-optimizer-mcp with {}
```

---

## Architecture

### Cost Optimization Flow

```
User Request
    ↓
Architect MCP (plan with Ollama - FREE)
    ↓
Credit Optimizer (route to cheapest option)
    ↓
    ├─→ Autonomous Agent (Ollama - FREE) ← 90% of work
    ├─→ Thinking Tools (CPU - FREE)
    └─→ OpenAI Worker (paid - only when value > cost)
```

### Broker Pattern

Robinson's Toolkit uses lazy worker spawning:
- Workers spawn on-demand (not at startup)
- Max 6 active workers at once
- Idle workers killed after 5 minutes
- Connection pooling prevents memory leaks

### Budget Enforcement

OpenAI Worker has 3-tier protection:
1. **Pre-flight:** Estimate cost before running
2. **Runtime:** Track tokens and abort if over limit
3. **Monthly:** Hard stop at $25 budget

---

## Usage Examples

### Generate Code (FREE)
```
Use tool delegate_code_generation_autonomous-agent-mcp with {
  "task": "Create a React component for user profile",
  "context": "TypeScript, Tailwind CSS, shadcn/ui",
  "complexity": "medium"
}
```

### Plan Work (FREE)
```
Use tool submit_spec_architect-mcp with {
  "title": "Add OAuth",
  "text": "Implement Google and GitHub OAuth with PKCE flow"
}
Use tool plan_work_architect-mcp with {"spec_id": 1, "mode": "balanced"}
```

### Execute Workflow (FREE)
```
Use tool execute_recipe_credit-optimizer-mcp with {
  "name": "add-authentication",
  "params": {"provider": "supabase"}
}
```

### Escalate to OpenAI (PAID)
```
Use tool estimate_cost_openai-worker-mcp with {
  "agent": "premium-worker",
  "estimated_input_tokens": 5000,
  "estimated_output_tokens": 2000
}
# If cost is acceptable:
Use tool run_job_openai-worker-mcp with {
  "agent": "premium-worker",
  "task": "Write marketing copy for landing page"
}
```

### Use Integrations
```
Use tool broker_call_robinsons-toolkit-mcp with {
  "server": "github-mcp",
  "tool": "create_pull_request",
  "args": {
    "owner": "robinsonai",
    "repo": "cortiware",
    "title": "Add authentication",
    "body": "Implements OAuth with Supabase",
    "head": "feature/auth",
    "base": "main"
  }
}
```

---

## Troubleshooting

### Ollama Not Responding
```bash
# Check status
ollama --version
ollama list

# Restart
# Windows: Close and reopen Ollama app
# macOS: brew services restart ollama
# Linux: sudo systemctl restart ollama
```

### OpenAI Budget Exceeded
```
Use tool get_spend_stats_openai-worker-mcp with {}
# Wait until next month or increase MONTHLY_BUDGET in config
```

### Broker Connection Errors
1. Restart VS Code completely
2. Check Augment MCP panel for errors
3. Verify credentials in robinsons-toolkit-mcp env
4. Check broker stats: `Use tool broker_stats_robinsons-toolkit-mcp with {}`

### Build Errors
```bash
# Clean rebuild
rm -rf node_modules package-lock.json
npm install
npm run build --workspaces --if-present
```

---

## Maintenance

### Daily
- Quick validation (thinking-tools + broker)
- Check Ollama is running

### Weekly
- Full smoke test
- Review autonomous agent stats
- Check OpenAI spend

### Monthly
- Update Ollama models
- Rotate API keys
- Review and optimize workflows
- Check for package updates

### Quarterly
- Audit integration credentials
- Review cost savings
- Update documentation

---

## Performance Benchmarks

**Measured on:** Windows 11, 32GB RAM, RTX 3080 (12GB VRAM)

| Server | Operation | Time | Cost |
|--------|-----------|------|------|
| thinking-tools-mcp | Devils advocate | <1s | $0 |
| autonomous-agent-mcp | Code generation | 30-60s | $0 |
| architect-mcp | Plan creation | 10-45s | $0 |
| openai-worker-mcp | Mini job | 2-5s | ~$0.001 |
| credit-optimizer-mcp | Tool discovery | <1s | $0 |
| robinsons-toolkit-mcp | Broker call | 2-5s | Varies |

**Total Savings:** 90%+ by using local Ollama for most work

---

## Security

- ✅ All API keys in environment variables (not hardcoded)
- ✅ `.env.local` in `.gitignore`
- ✅ Budget enforcement prevents runaway costs
- ✅ Timeout protection on all operations
- ✅ Concurrency limits prevent resource exhaustion
- ✅ Lazy worker spawning reduces attack surface

**Rotate these keys regularly:**
- OPENAI_API_KEY
- GITHUB_TOKEN
- VERCEL_TOKEN
- NEON_API_KEY
- STRIPE_SECRET_KEY
- All other integration tokens

---

## Support

**Issues:** https://github.com/robinsonai/mcp-servers/issues  
**Docs:** https://github.com/robinsonai/mcp-servers/docs  
**Email:** ops@robinsonaisystems.com

---

**Built by:** Robinson AI Systems  
**License:** MIT  
**Version:** 1.0.0

