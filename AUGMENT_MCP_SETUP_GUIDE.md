# Augment Code MCP Server Setup Guide

**Complete guide for setting up 6 Robinson AI MCP servers in Augment Code**

Last Updated: October 31, 2025

---

## 🎯 Overview

This guide walks you through configuring **6 MCP servers** to extend Augment Code with 900+ additional tools:

| Server | Tools | Purpose |
|--------|-------|---------|
| **Thinking Tools** | 24 | Multi-step reasoning, planning, research |
| **OpenAI MCP** | ~15 | Direct OpenAI API access (GPT-4, embeddings, etc.) |
| **Paid Agent** | ~20 | Offload tasks to paid cloud LLMs (OpenAI, Anthropic) |
| **Credit Optimizer** | ~12 | Track & optimize Augment credit usage |
| **Free Agent** | 19 | Offload tasks to FREE local Ollama LLMs (0 credits!) |
| **Robinson's Toolkit** | 906 | GitHub, Vercel, Neon, Upstash, Google Workspace, etc. |

**Total: ~996 tools** available to Augment Code after setup.

---

## ✅ Prerequisites

### 1. **Global npm packages installed**

All 6 MCP servers must be globally installed and linked:

```powershell
# From the workspace root
npm install -g packages/thinking-tools-mcp
npm install -g packages/openai-mcp
npm install -g packages/paid-agent-mcp
npm install -g packages/credit-optimizer-mcp
npm install -g packages/free-agent-mcp
npm install -g packages/robinsons-toolkit-mcp
```

**Verify installation:**
```powershell
# Check that global shims exist
ls C:\nvm4w\nodejs\*-mcp.cmd
# Should show: thinking-tools-mcp.cmd, openai-mcp.cmd, paid-agent-mcp.cmd, 
#              credit-optimizer-mcp.cmd, free-agent-mcp.cmd, robinsons-toolkit-mcp.cmd
```

### 2. **Environment variables configured**

#### Required for all users:
- `OPENAI_API_KEY` - Required by OpenAI MCP and Paid Agent MCP

#### Optional (for Free Agent):
- `OLLAMA_BASE_URL` - Default: `http://localhost:11434` (already inlined in import)

#### Optional (for Paid Agent):
- `ANTHROPIC_API_KEY` - For Claude models
- `MAX_WORKER_CONCURRENCY` - Default: 3

#### Optional (for Credit Optimizer):
- `AUGMENT_CREDITS_PER_MONTH` - Your Augment plan's monthly credits
- `AUGMENT_COST_PER_MONTH` - Your Augment plan's monthly cost
- `OPTIMIZER_DB` - Custom SQLite DB path (defaults to workspace)

#### Optional (for Robinson's Toolkit):
- `GITHUB_TOKEN` - GitHub API access
- `VERCEL_TOKEN` - Vercel deployments
- `NEON_API_KEY` - Neon Postgres management
- `UPSTASH_REDIS_REST_URL` - Upstash Redis endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis auth
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Google Workspace API (JSON key)
- `GOOGLE_USER_EMAIL` - Email for Google Workspace delegation

**Set environment variables (PowerShell - User scope):**
```powershell
[Environment]::SetEnvironmentVariable('OPENAI_API_KEY', 'sk-...', 'User')
[Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'ghp_...', 'User')
# Add others as needed
```

**Important:** Restart VS Code after setting new environment variables so the extension host inherits them.

### 3. **Ollama running (for Free Agent only)**

If you want to use Free Agent MCP (offload work to local LLMs):

```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If using Docker Compose (from workspace root):
docker-compose up -d

# Pull recommended models:
ollama pull deepseek-coder:33b
ollama pull qwen2.5-coder:32b
ollama pull codellama:34b
ollama pull qwen2.5:3b
```

---

## 📥 Import Process

### Option A: Import All 6 Servers at Once (Fastest)

1. **Clear Augment's MCP cache** (if you've had previous failed imports):
   ```powershell
   Remove-Item -Force "$env:APPDATA\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServers.json" -ErrorAction SilentlyContinue
   Remove-Item -Force "$env:APPDATA\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServerInstances.json" -ErrorAction SilentlyContinue
   ```

2. **Open VS Code Settings** → Search for "MCP"

3. **Find "Augment: MCP Servers"** setting

4. **Click "Edit in settings.json"** (or use the UI to import)

5. **Import the consolidated file:**
   - Copy the full path: `C:\Users\chris\Git Local\robinsonai-mcp-servers\AUGMENT_IMPORT_ALL_6_SERVERS.json`
   - In Augment's MCP settings UI, click "Import from file" and paste the path
   - OR manually paste the JSON content into `settings.json` under `"augment.mcpServers"`

If you suspect a name mismatch between config and serverInfo, try the aligned variant instead:
- `AUGMENT_IMPORT_ALL_6_SERVERS_ALIGNED.json` (names match each server's `serverInfo.name` exactly)

6. **Reload VS Code window:**
   - Press `Ctrl+Shift+P`
   - Type "Developer: Reload Window"
   - Press Enter

7. **Verify all 6 servers are green:**
   - Open Augment's MCP panel (should show in the sidebar or via command palette)
   - All 6 servers should show green status with tool counts

### Option B: Core vs Full imports (Recommended for stability)

If Augment's UI gets sluggish when loading ~1000 tools, use the smaller Core import for daily work and enable Toolkit only when needed.

- Core (5 servers): `AUGMENT_IMPORT_CORE_5_SERVERS.json` — excludes Toolkit; fastest and most stable
- Full (6 servers): `AUGMENT_IMPORT_ALL_6_SERVERS.json` — includes Toolkit (906 tools)
 - Full (aligned): `AUGMENT_IMPORT_ALL_6_SERVERS_ALIGNED.json` — same as Full, but with names exactly matching `serverInfo.name` for maximal compatibility

Switching steps:
1) Clear Augment cache (commands below)
2) Import either Core or Full file
3) Reload the window

### Option C: Import Incrementally (Troubleshooting)

If the consolidated import causes issues, import one server at a time using the individual files in `imports/`:

1. Start with `imports/THINKING_TOOLS.json`
2. Import, reload window, verify green
3. Then `imports/OPENAI_MCP.json`, reload, verify
4. Continue with: `PAID_AGENT_MCP.json`, `CREDIT_OPTIMIZER_SAFE.json`, `FREE_AGENT_MCP.json`, `TOOLKIT_MCP.json`

**Note:** Use `CREDIT_OPTIMIZER_SAFE.json` instead of the standard one—it skips heavy startup indexing.

---

## 🔧 What Each Server Does

### 1. **Thinking Tools MCP** (24 tools)
**No configuration needed**

Provides structured reasoning capabilities:
- `multi_step_planning` - Break down complex tasks
- `research_gather` - Collect and synthesize information
- `decision_matrix` - Evaluate options systematically
- `brainstorm` - Generate creative solutions
- And 20 more reasoning patterns

**Use when:** You need Augment to "think through" a complex problem step-by-step.

---

### 2. **OpenAI MCP** (~15 tools)
**Requires:** `OPENAI_API_KEY`

Direct OpenAI API access:
- `chat_completion` - Call GPT-4, GPT-3.5, etc.
- `create_embedding` - Generate embeddings
- `create_image` - DALL-E image generation
- `create_speech` - Text-to-speech
- `transcribe_audio` - Whisper transcription
- And more

**Use when:** You want Augment to directly call OpenAI APIs without going through Augment's own credit system.

---

### 3. **Paid Agent MCP** (~20 tools)
**Requires:** `OPENAI_API_KEY`  
**Optional:** `ANTHROPIC_API_KEY`, `MAX_WORKER_CONCURRENCY`

Offload tasks to cloud LLMs via OpenAI Workers:
- `execute_versatile_task` - Run any task using paid cloud LLMs
- `delegate_code_generation` - Generate code via OpenAI (uses your API key, not Augment credits)
- `delegate_code_analysis` - Analyze code
- `delegate_refactoring` - Refactor code
- `delegate_test_generation` - Generate tests
- And more code/documentation/research tasks

**Use when:** You want to offload heavy work to cloud LLMs but pay directly via your own API keys instead of Augment credits.

---

### 4. **Credit Optimizer MCP** (~12 tools)
**Optional:** `AUGMENT_CREDITS_PER_MONTH`, `AUGMENT_COST_PER_MONTH`, `OPTIMIZER_DB`

Tracks Augment credit usage and suggests optimizations:
- `get_credit_stats` - See credit usage over time
- `analyze_usage_patterns` - Find credit-heavy operations
- `suggest_optimizations` - Get tips to reduce credit spend
- `compare_alternatives` - Compare Augment vs. direct API costs
- And more analytics tools

**Use when:** You want visibility into where your Augment credits are going and how to optimize.

**Note:** This import uses the SAFE variant (`CREDIT_OPTIMIZER_SKIP_INDEX=1`) to prevent heavy startup indexing.

---

### 5. **Free Agent MCP** (19 tools)
**Requires:** Ollama running on `http://localhost:11434`

Offload tasks to FREE local Ollama LLMs (0 Augment credits!):
- `delegate_code_generation` - Generate code using local LLMs (DeepSeek Coder, Qwen, etc.)
- `delegate_code_analysis` - Analyze code for issues
- `delegate_refactoring` - Refactor code
- `delegate_test_generation` - Generate tests
- `execute_versatile_task` - Run any task using local LLMs + Robinson's Toolkit (906 tools)
- Universal file editing tools: `file_str_replace`, `file_insert`, `file_save`, `file_delete`, `file_read`
- Feedback system: `submit_feedback`, `get_feedback_stats`

**Use when:** You want to save Augment credits by running tasks on your local machine. Works best for:
- Code generation (simple to medium complexity)
- Code analysis and refactoring
- Test generation
- Documentation

**Performance vs. Augment:**
- Quality: 70-90% of Augment's output (for code tasks)
- Speed: Slower (10-60 seconds depending on complexity and quality setting)
- Cost: $0 (uses your local GPU/CPU)

**Models recommended:**
- `deepseek-coder:33b` - Best for complex code (requires 24GB+ RAM)
- `qwen2.5-coder:32b` - Excellent for medium tasks (requires 20GB+ RAM)
- `codellama:34b` - Good general purpose (requires 24GB+ RAM)
- `qwen2.5:3b` - Fast, simple tasks (requires 4GB RAM)

---

### 6. **Robinson's Toolkit MCP** (906 tools)
**Optional:** Service-specific API keys (see environment variables above)

Comprehensive API integrations:
- **GitHub** (~200 tools) - Repos, PRs, issues, actions, releases
- **Vercel** (~150 tools) - Deployments, projects, domains, env vars
- **Neon** (~100 tools) - Postgres database management
- **Upstash Redis** (~80 tools) - Redis operations
- **Google Workspace** (~200 tools) - Gmail, Calendar, Drive, Docs, Sheets
- **And more:** Stripe, Twilio, Resend, Supabase, Playwright, etc.

**Use when:** You want Augment to directly interact with your cloud services and APIs.

**Note:** Tools will enumerate even without API keys, but will fail at execution time if credentials are missing.

---

## 🐛 Troubleshooting

### Server shows "Red" or "0 tools available"

**Common causes:**

1. **Server name mismatch:**
   - Augment maps tools by the server's reported `serverInfo.name`
   - Some servers intentionally report names with scope or without `-mcp` (e.g., `@robinsonai/openai-mcp`, `robinsons-toolkit`)
   - Use `AUGMENT_IMPORT_ALL_6_SERVERS_ALIGNED.json` to ensure import names match `serverInfo.name`
   - If you changed a server's reported name, rebuild: `npm run build -w packages/<server-name>`

2. **Environment variable not inherited by extension host:**
   - VS Code's extension host may not inherit shell environment variables
   - **Solution:** Restart VS Code after setting env vars, or inline values in the import JSON
   - Example: Free Agent's import inlines `OLLAMA_BASE_URL` instead of using `${env:OLLAMA_BASE_URL}`

3. **Stale cache:**
   - Clear Augment's MCP cache and reload:
     ```powershell
     Remove-Item -Force "$env:APPDATA\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServers.json" -ErrorAction SilentlyContinue
     Remove-Item -Force "$env:APPDATA\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServerInstances.json" -ErrorAction SilentlyContinue
     ```
   - Then reload VS Code window

4. **Heavy startup causing timeout:**
   - Credit Optimizer had this issue; fixed with `CREDIT_OPTIMIZER_SKIP_INDEX=1`
   - If another server hangs, create a SAFE variant with minimal initialization

5. **Path or command issues:**
   - Verify global shims exist: `ls C:\nvm4w\nodejs\*-mcp.cmd`
   - Ensure `C:\nvm4w\nodejs` is in your PATH
   - All imports use absolute paths to avoid shell context issues

### Server shows green but tools fail to execute

**Common causes:**

1. **Missing API keys:**
   - Check that required environment variables are set
   - Verify with: `echo $env:OPENAI_API_KEY` (PowerShell)

2. **Ollama not running (Free Agent only):**
   - Test: `curl http://localhost:11434/api/tags`
   - Start: `docker-compose up -d` or run Ollama directly

3. **Service API down or rate-limited:**
   - Check service status pages (GitHub, Vercel, etc.)
   - Review Augment's output panel for error messages

### Verify a server manually (stdio handshake test)

Test a server outside Augment:

```powershell
node tools/mcp-handshake-test.mjs "C:\nvm4w\nodejs\<server-name>.cmd"
```

Example:
```powershell
node tools/mcp-handshake-test.mjs "C:\nvm4w\nodejs\free-agent-mcp.cmd" --env OLLAMA_BASE_URL=http://localhost:11434
```

Should print:
- Initialize response with `serverInfo.name`
- Tools list with full tool definitions

If this works but Augment shows 0 tools, it's an Augment extension host issue (env, cache, or spawn context).

---

## 🎓 Best Practices

### 1. **Use the right server for the job**

- **Simple queries/logic:** Use Augment directly (don't waste credits)
- **Complex reasoning:** Use Thinking Tools MCP
- **Code generation (credit-conscious):** Use Free Agent MCP (0 credits, slower)
- **Code generation (speed-conscious):** Use Paid Agent MCP (your API keys, faster)
- **API/service interactions:** Use Robinson's Toolkit MCP
- **Track spending:** Use Credit Optimizer MCP

### 2. **Monitor credit usage**

Use Credit Optimizer's `get_credit_stats` regularly to understand where your credits go.

### 3. **Combine servers**

Example workflows:
- **Research + Implementation:** Thinking Tools (`research_gather`) → Free Agent (`delegate_code_generation`)
- **Generate + Deploy:** Free Agent (`delegate_code_generation`) → Toolkit (`vercel_deploy`)
- **Analyze + Optimize:** Credit Optimizer (`analyze_usage_patterns`) → Thinking Tools (`decision_matrix` on whether to switch tools)

### 4. **Graceful degradation**

If a server is down or slow:
- Remove it from your import temporarily
- Use individual import files (`imports/`) to disable/enable specific servers
- Keep `THINKING_TOOLS.json` and `OPENAI_MCP.json` as your baseline (most stable)

---

## 🔄 Updating Servers

When you pull new code or make changes:

1. **Rebuild affected server:**
   ```powershell
   npm run build -w packages/<server-name>
   ```

2. **If you changed global dependencies:**
   ```powershell
   npm install -g packages/<server-name>
   ```

3. **Clear Augment cache and reload:**
   ```powershell
   Remove-Item -Force "$env:APPDATA\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServers.json" -ErrorAction SilentlyContinue
   ```
   Then reload VS Code window.

---

## 📊 Expected Tool Counts

After successful import, you should see:

| Server | Tool Count | Status Indicator |
|--------|------------|------------------|
| thinking-tools-mcp | 24 | 🟢 Green |
| openai-mcp | ~15 | 🟢 Green |
| paid-agent-mcp | ~20 | 🟢 Green |
| credit-optimizer-mcp | ~12 | 🟢 Green |
| free-agent-mcp | 19 | 🟢 Green |
| robinsons-toolkit-mcp | 906 | 🟢 Green |

**Total: ~996 tools**

If any server shows 0 tools or red status, see the Troubleshooting section above.

---

## 🆘 Quick Reference Commands

### Clear Augment MCP cache:
```powershell
Remove-Item -Force "$env:APPDATA\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServers.json" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:APPDATA\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServerInstances.json" -ErrorAction SilentlyContinue
```

### Test server handshake:
```powershell
node tools/mcp-handshake-test.mjs "C:\nvm4w\nodejs\<server-name>.cmd"
```

### Check environment variables:
```powershell
$env:OPENAI_API_KEY
$env:GITHUB_TOKEN
$env:OLLAMA_BASE_URL
```

### Verify global shims:
```powershell
ls C:\nvm4w\nodejs\*-mcp.cmd
```

### Check Ollama:
```powershell
curl http://localhost:11434/api/tags
```

### Rebuild a server:
```powershell
npm run build -w packages/<server-name>
```

---

## 📝 Import File Reference

- **All 6 servers:** `AUGMENT_IMPORT_ALL_6_SERVERS.json` (use this)
- **Individual servers:**
  - `imports/THINKING_TOOLS.json`
  - `imports/OPENAI_MCP.json`
  - `imports/PAID_AGENT_MCP.json`
  - `imports/CREDIT_OPTIMIZER_SAFE.json` (preferred over standard)
  - `imports/FREE_AGENT_MCP.json`
  - `imports/TOOLKIT_MCP.json`

---

## 🎉 Success Indicators

After setup, you should be able to:
- ✅ See all 6 servers listed in Augment's MCP panel
- ✅ All servers show green status
- ✅ Tool counts match the table above (~996 total)
- ✅ Ask Augment to use specific tools (e.g., "Use free-agent to generate a React component")
- ✅ Augment suggests tools from all servers when relevant to your task

---

## 🤝 Support

If you encounter issues not covered in this guide:

1. **Check the handshake test** to verify the server works outside Augment
2. **Review Augment's output panel** for error messages
3. **Try the incremental import approach** (Option B) to isolate the problem
4. **Check server-specific logs** (many write to the workspace or temp directories)

---

**Happy coding with 996 additional tools! 🚀**

### Augment settings UI hangs or doesn't render

When importing the Full set (~996 tools), the Tools page may stall due to rendering a very large tool list.

Fix:
- Clear Augment cache (commands below)
- Import `AUGMENT_IMPORT_CORE_5_SERVERS.json` instead of the Full set
- Reload the window
- Add Toolkit later if needed (or avoid opening the Tools page while Full is active)
