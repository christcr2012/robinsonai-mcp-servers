# Augment Code Bring-Up Checklist

## 🎯 Purpose
This checklist fixes the common "missing tools" issues when setting up Robinson AI MCP servers with Augment Code.

---

## 📦 1. Packaging Requirements (All Servers)

### ✅ package.json Configuration
Each server package must have:

```json
{
  "type": "module",
  "bin": {
    "server-name-mcp": "./dist/index.js"
  }
}
```

**Check all 4 core servers:**
- [ ] `packages/architect-mcp/package.json` has `"bin": { "architect-mcp": "./dist/index.js" }`
- [ ] `packages/autonomous-agent-mcp/package.json` has `"bin": { "autonomous-agent-mcp": "./dist/index.js" }`
- [ ] `packages/credit-optimizer-mcp/package.json` has `"bin": { "credit-optimizer-mcp": "./dist/index.js" }`
- [ ] `packages/robinsons-toolkit-mcp/package.json` has `"bin": { "robinsons-toolkit-mcp": "./dist/index.js" }`

### ✅ Shebang in Built Output
The compiled `dist/index.js` must start with:
```javascript
#!/usr/bin/env node
```

**Verify:**
```bash
head -n 1 packages/architect-mcp/dist/index.js
head -n 1 packages/autonomous-agent-mcp/dist/index.js
head -n 1 packages/credit-optimizer-mcp/dist/index.js
head -n 1 packages/robinsons-toolkit-mcp/dist/index.js
```

### ✅ MCP Return Types
All tool handlers must return exact MCP type:
```typescript
Promise<{ content: Array<{ type: string; text: string }> }>
// OR for JSON responses:
Promise<{ content: Array<{ type: "json"; json: any }> }>
```

**Common mistake:** Returning raw strings or objects instead of `{ content: [...] }` wrapper.

### ✅ Build and Link
```bash
# Build all packages
npm run build

# Link each package globally
cd packages/architect-mcp && npm link
cd ../autonomous-agent-mcp && npm link
cd ../credit-optimizer-mcp && npm link
cd ../robinsons-toolkit-mcp && npm link
```

**Verify npx works:**
```bash
npx architect-mcp --help
npx autonomous-agent-mcp --help
npx credit-optimizer-mcp --help
npx robinsons-toolkit-mcp --help
```

---

## 🔐 2. Environment Variables

### Core Servers (Required for Ollama integration)
```bash
# For architect-mcp and autonomous-agent-mcp
export OLLAMA_BASE_URL="http://localhost:11434"
export ARCHITECT_FAST_MODEL="qwen2.5:3b"
export ARCHITECT_STD_MODEL="deepseek-coder:33b"
export ARCHITECT_BIG_MODEL="qwen2.5-coder:32b"
```

**Verify Ollama is running:**
```bash
curl http://localhost:11434/api/tags
```

### Integration Servers (Optional - only if using Firehose config)

**GitHub:**
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_..."
```

**Vercel:**
```bash
export VERCEL_API_TOKEN="..."
```

**Neon:**
```bash
export NEON_API_KEY="..."
```

**Twilio:**
```bash
export TWILIO_ACCOUNT_SID="..."
export TWILIO_AUTH_TOKEN="..."
```

**Resend:**
```bash
export RESEND_API_KEY="..."
```

**Cloudflare:**
```bash
export CLOUDFLARE_API_TOKEN="..."
```

**Redis:**
```bash
export REDIS_URL="redis://localhost:6379"
```

**OpenAI:**
```bash
export OPENAI_API_KEY="sk-..."
```

**Google Workspace:**
```bash
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export GOOGLE_REFRESH_TOKEN="..."
```

**Note:** Missing environment variables will cause tools to be hidden. Use `robinsons-toolkit-mcp.diagnose_environment` to see which integrations are missing credentials.

---

## ⚡ 3. Performance Safety Nets

### Architect MCP
- [x] **Repo map caching**: Cached by HEAD commit hash (SQLite)
- [x] **Small planner model**: Default to `qwen2.5:3b` (fast model)
- [x] **Handle-based returns**: Returns `{plan_id}` instead of full plan JSON
- [x] **SQLite WAL mode**: Enabled for concurrent access

### Credit Optimizer MCP
- [x] **Autonomous executor**: Runs without "continue?" prompts
- [x] **Tool indexing**: Zero-AI tool discovery via SQLite index
- [x] **Template system**: Reusable workflow templates
- [x] **Large output persistence**: Stores results with IDs, not in stdio

### Robinson's Toolkit MCP
- [x] **Lazy loading**: Only loads integrations when env vars present
- [x] **Diagnostic tools**: `diagnose_environment` shows missing/dropped tools
- [x] **Manifest count tracking**: Reports total available vs mounted tools

---

## 🚀 4. Augment Code Configuration

### Step 1: Choose Configuration

**Option A: Lean (Recommended)**
- Import `mcp-config-lean.json`
- 4 servers, ~50 meta-tools
- Toolkit discovers/proxies 900+ tools on demand
- **Fastest startup, lowest memory**

**Option B: Firehose**
- Import `mcp-config-firehose.json`
- 15 servers, 900+ tools visible immediately
- All integrations listed in Augment's toolbox
- **Slower startup, higher memory**

### Step 2: Import Configuration

1. Open **Augment Settings Panel** (gear icon in Augment panel)
2. In the MCP section, click **"Import from JSON"**
3. Paste the contents of `mcp-config-lean.json` or `mcp-config-firehose.json`
4. Click **Save**
5. **Restart VS Code completely** (close all windows)

### Step 3: Paste Instructions Block

1. Open **Augment Settings Panel**
2. Find the **"Instructions"** text area
3. Paste the contents of `augment-instructions.txt`
4. Click **Save**

---

## 🔍 5. Verification Steps

### After Restart, Check:

1. **MCP Servers Loaded**
   - Open Augment panel
   - Look for "MCP Servers" section
   - Should show 4 servers (Lean) or 15 servers (Firehose)
   - Each server should show tool count (not "0 tools available")

2. **Run Diagnostics**
   ```
   Call: robinsons-toolkit-mcp.diagnose_environment
   ```
   
   **Expected output:**
   ```json
   {
     "manifest_count": 912,
     "mounted_count": 912,
     "missing_env": [],
     "dropped_tools": []
   }
   ```

3. **Test Golden Path**
   ```
   1. Call: architect-mcp.plan_work({ 
        goal: "Add a hello world function to index.ts",
        depth: "fast",
        budgets: { max_steps: 5, time_ms: 60000, max_files_changed: 1 }
      })
   
   2. Call: architect-mcp.export_workplan_to_optimizer({ plan_id: "<from step 1>" })
   
   3. Call: credit-optimizer-mcp.execute_autonomous_workflow({ workflow: "<from step 2>" })
   ```

---

## 🐛 6. Troubleshooting

### "0 tools available" for all servers

**Cause:** Servers not built or not linked globally.

**Fix:**
```bash
npm run build
cd packages/architect-mcp && npm link
cd ../autonomous-agent-mcp && npm link
cd ../credit-optimizer-mcp && npm link
cd ../robinsons-toolkit-mcp && npm link
```

### "0 tools available" for specific server

**Cause:** Missing shebang or incorrect bin field.

**Fix:**
```bash
# Check shebang
head -n 1 packages/<server-name>/dist/index.js

# Should output: #!/usr/bin/env node
# If missing, add to src/index.ts and rebuild
```

### Tools missing from Toolkit

**Cause:** Missing environment variables for integrations.

**Fix:**
```bash
# Run diagnostics
npx robinsons-toolkit-mcp

# Then call: diagnose_environment
# Check "missing_env" array
# Set the required environment variables
# Restart Augment
```

### Architect/Agent tools fail

**Cause:** Ollama not running or wrong URL.

**Fix:**
```bash
# Check Ollama
curl http://localhost:11434/api/tags

# If fails, start Ollama
ollama serve

# Verify models are pulled
ollama pull qwen2.5:3b
ollama pull deepseek-coder:33b
ollama pull qwen2.5-coder:32b
```

### Server starts but crashes on first tool call

**Cause:** Tool handler returning wrong type (not MCP-compliant).

**Fix:**
- Check that all handlers return `{ content: [{ type: "text", text: "..." }] }`
- Never return raw strings, objects, or arrays
- Use `{ type: "json", json: {...} }` for structured data

---

## ✅ Success Criteria

After completing this checklist:

- [ ] All 4 core servers show tool counts in Augment panel
- [ ] `diagnose_environment` shows no dropped tools
- [ ] Golden path test completes without errors
- [ ] Architect plans execute autonomously via Optimizer
- [ ] No "continue?" prompts during autonomous execution
- [ ] Local LLM delegation works (Ollama responding)

---

## 📚 Reference Files

- **Lean Config**: `mcp-config-lean.json`
- **Firehose Config**: `mcp-config-firehose.json`
- **Instructions**: `augment-instructions.txt`
- **Verify Script**: `verify-bins.mjs` (run to check all bin fields)

