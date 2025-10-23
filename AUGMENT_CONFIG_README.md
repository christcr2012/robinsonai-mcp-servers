# Augment MCP Configuration Guide

This guide explains how to configure all 6 MCP servers in Augment Code.

## Quick Setup

1. **Copy the template**:
   ```bash
   cp COPY_PASTE_THIS_INTO_AUGMENT.json.template COPY_PASTE_THIS_INTO_AUGMENT.json
   ```

2. **Add your OpenAI API key**:
   - Open `COPY_PASTE_THIS_INTO_AUGMENT.json`
   - Replace `<YOUR_OPENAI_API_KEY_HERE>` with your actual OpenAI API key
   - **IMPORTANT**: Never commit this file to git (it's in .gitignore)

3. **Import to Augment**:
   - Press `Ctrl+Shift+P` → "Augment: Open Settings"
   - Go to **Tools → MCP Servers**
   - Click **"Import from JSON"**
   - Paste the contents of `COPY_PASTE_THIS_INTO_AUGMENT.json`
   - Save settings

4. **Reload VS Code**:
   - Press `Ctrl+Shift+P` → "Developer: Reload Window"
   - Wait 15 seconds for all 6 servers to connect

## Verify All Servers Connected

After reload, you should see all 6 servers in Augment:

- ✅ **architect-mcp** (13 tools) - Strategic planning
- ✅ **autonomous-agent-mcp** (8 tools) - Code generation (FREE Ollama)
- ✅ **openai-worker-mcp** (8 tools) - Escalation for complex tasks (PAID)
- ✅ **thinking-tools-mcp** (15 tools) - Cognitive frameworks
- ✅ **credit-optimizer-mcp** (30+ tools) - Workflow execution
- ✅ **robinsons-toolkit-mcp** (1,197 tools) - Integration broker

## Configuration Details

### Architect MCP
Strategic planning using local Ollama models.

**Environment Variables**:
- `OLLAMA_BASE_URL`: `http://127.0.0.1:11434`
- `ARCHITECT_FAST_MODEL`: `qwen2.5:3b` (1.9GB)
- `ARCHITECT_STD_MODEL`: `deepseek-coder:33b` (18GB)
- `ARCHITECT_BIG_MODEL`: `qwen2.5-coder:32b` (19GB)
- `ARCHITECT_MAX_STEPS`: `8` (max steps per plan)
- `ARCHITECT_PLANNER_TIME_MS`: `45000` (45s max planning time)
- `ARCHITECT_PLANNER_SLICE_MS`: `2000` (2s per slice)

**Features**:
- General-purpose planning (no keyword matching)
- Non-blocking with timeout+fallback
- Deterministic skeleton steps if Ollama unavailable

### Autonomous Agent MCP
Code generation using local Ollama models (FREE).

**Environment Variables**:
- `OLLAMA_BASE_URL`: `http://127.0.0.1:11434`
- `MAX_OLLAMA_CONCURRENCY`: `2` (max parallel jobs)

**Cost**: $0 (uses local Ollama)

**Tools**:
- `delegate_code_generation` - Generate code
- `delegate_code_analysis` - Analyze code
- `delegate_code_refactoring` - Refactor code
- `delegate_test_generation` - Generate tests
- `delegate_documentation` - Generate docs
- `get_agent_stats` - View usage stats
- `get_token_analytics` - View token usage
- `diagnose_autonomous_agent` - Health check

### OpenAI Worker MCP
Escalation for complex reasoning (PAID, budget-controlled).

**Environment Variables**:
- `OPENAI_API_KEY`: Your OpenAI API key (**REQUIRED**)
- `MONTHLY_BUDGET`: `25` ($25/month budget)
- `MAX_OPENAI_CONCURRENCY`: `1` (max parallel jobs)
- `PER_JOB_TOKEN_LIMIT`: `6000` (max tokens per job)

**Cost**: ~$0.002 per request (budget-controlled)

**Tools**:
- `run_job` - Execute job with mini/balanced/premium worker
- `queue_batch` - Queue multiple jobs for batch processing
- `get_job_status` - Check job status
- `get_spend_stats` - View monthly spend
- `estimate_cost` - Estimate cost before running
- `get_capacity` - Check worker availability
- `refresh_pricing` - Update pricing from OpenAI
- `get_token_analytics` - View token usage

### Thinking Tools MCP
15+ cognitive frameworks for problem-solving.

**No configuration required** (no environment variables).

**Frameworks**:
- `devils_advocate` - Challenge assumptions
- `first_principles` - Break down to fundamentals
- `root_cause` - 5 Whys analysis
- `swot_analysis` - Strengths/Weaknesses/Opportunities/Threats
- `premortem_analysis` - Imagine failure scenarios
- `critical_thinking` - Evaluate arguments
- `lateral_thinking` - Creative solutions
- `red_team` - Attack the plan
- `blue_team` - Defend the plan
- `decision_matrix` - Weighted decision-making
- `socratic_questioning` - Deep inquiry
- `systems_thinking` - Interconnections & feedback loops
- `scenario_planning` - Explore possible futures
- `brainstorming` - Generate ideas quickly
- `mind_mapping` - Visual organization

### Credit Optimizer MCP
Workflow execution and tool indexing.

**No configuration required** (no environment variables).

**Features**:
- Autonomous workflows (no confirmation loops)
- Bulk fixes across many files
- Refactoring patterns
- Test generation
- Scaffolding (components, APIs, schemas, tests)
- Caching (analysis, decisions)
- GitHub PR creation
- Recipes & blueprints

**Tools**: 30+ (see `discover_tools` for full list)

### Robinson's Toolkit MCP
Broker for 13 integrations (1,197 tools total).

**Environment Variables**:
- `RTK_MAX_ACTIVE`: `6` (max active workers)
- `RTK_IDLE_SECS`: `300` (5min idle timeout)
- `RTK_TOOL_TIMEOUT_MS`: `60000` (60s tool timeout)
- `RTK_PREWARM`: `""` (no pre-warming)

**Integrations**:
- GitHub (repos, PRs, issues)
- Vercel (deployments)
- Neon (Postgres)
- Redis (caching)
- Playwright (browser testing)
- Context7 (documentation)
- Google Workspace (Gmail, Drive, Calendar)
- Stripe (payments)
- Supabase (backend)
- Resend (email)
- Twilio (SMS)
- Cloudflare (CDN, Workers)
- Fly.io (deployments)

**Tools**: 1,197 total (use `discover_tools` to search)

## Prerequisites

### Ollama Setup
You must have Ollama running locally with these models:

```bash
# Install Ollama (if not already installed)
# Download from https://ollama.ai

# Pull required models
ollama pull qwen2.5:3b          # 1.9GB - fast model
ollama pull deepseek-coder:33b  # 18GB - standard model
ollama pull qwen2.5-coder:32b   # 19GB - big model
ollama pull codellama:34b       # 19GB - medium complexity (optional)
```

**Verify Ollama is running**:
```bash
curl http://127.0.0.1:11434/api/tags
```

### OpenAI API Key
Get your API key from https://platform.openai.com/api-keys

**Budget Control**:
- Default budget: $25/month
- Current spend tracked in real-time
- Jobs blocked if budget exceeded
- Use `get_spend_stats` to monitor usage

## Troubleshooting

### Servers Not Showing in Augment

1. **Check Augment settings**:
   - Press `Ctrl+Shift+P` → "Augment: Open Settings"
   - Verify all 6 servers are in the config

2. **Reload VS Code**:
   - Press `Ctrl+Shift+P` → "Developer: Reload Window"
   - Wait 15 seconds for servers to connect

3. **Check Ollama**:
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```
   If this fails, start Ollama

4. **Check OpenAI API key**:
   - Verify key is correct in config
   - Test with: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`

### Missing Dependencies

If servers fail to start, install dependencies:

```bash
npm install --workspace=packages/architect-mcp
npm install --workspace=packages/autonomous-agent-mcp
npm install --workspace=packages/openai-worker-mcp
npm install --workspace=packages/thinking-tools-mcp
npm install --workspace=packages/credit-optimizer-mcp
npm install --workspace=packages/robinsons-toolkit-mcp
```

### Architect Planner Stuck at 0%

This was fixed in the latest version. If you still see this:

1. **Rebuild architect-mcp**:
   ```bash
   cd packages/architect-mcp
   npm run build
   ```

2. **Reload VS Code**:
   - Press `Ctrl+Shift+P` → "Developer: Reload Window"

3. **Verify Ollama connectivity**:
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```

## Cost Optimization

The 6-server architecture is designed to route 90%+ of work to FREE local Ollama models:

| Server | Cost | Usage |
|--------|------|-------|
| **Architect** | $0 | FREE (Ollama) |
| **Autonomous Agent** | $0 | FREE (Ollama) |
| **OpenAI Worker** | ~$0.002/request | PAID (budget-controlled) |
| **Thinking Tools** | $0 | FREE (local logic) |
| **Credit Optimizer** | $0 | FREE (orchestration) |
| **Toolkit** | $0 | FREE (broker) |

**Expected Monthly Cost**: $0.50 - $5.00 (depending on OpenAI Worker usage)

**Augment Credits Saved**: 62,500+ (by using Ollama instead of Augment AI)

## Health Check

After setup, verify all servers are healthy:

```bash
# Check MCP_HEALTH.json for latest status
cat MCP_HEALTH.json

# Or run health checks manually
# (use Augment AI to call diagnose tools for each server)
```

## Support

For issues or questions:
- Check `VALIDATION_REPORT.md` for system status
- Check `MCP_HEALTH.json` for server health
- Review `PHASE_6_RESUME_POINT.md` for troubleshooting steps

## Security

**IMPORTANT**:
- Never commit `COPY_PASTE_THIS_INTO_AUGMENT.json` to git (contains API key)
- The file is in `.gitignore` to prevent accidental commits
- Use the `.template` file for sharing configurations
- Rotate your OpenAI API key if accidentally exposed

---

**Last Updated**: 2025-10-23  
**System Status**: ✅ READY FOR PRODUCTION

