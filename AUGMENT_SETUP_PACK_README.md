# 🚀 Augment Code Setup Pack - Robinson AI MCP Servers

## 📦 What's Included

This is a **drop-in setup pack** for configuring Robinson AI's 4-server MCP system with Augment Code.

### Files:

1. **`mcp-config-lean.json`** - Recommended configuration (4 core servers, fast & cheap)
2. **`mcp-config-firehose.json`** - All integrations visible (17 servers, 900+ tools)
3. **`augment-instructions.txt`** - Paste into Augment's Instructions box (enforces golden path)
4. **`AUGMENT_BRINGUP_CHECKLIST.md`** - Complete setup checklist (packaging, env, troubleshooting)
5. **`verify-bins.mjs`** - Script to verify all packages are correctly configured

---

## ⚡ Quick Start (3 Steps)

### 1️⃣ Import Configuration

**Choose one:**

- **Lean (Recommended)**: Fast startup, low memory, 4 servers
  - Copy contents of `mcp-config-lean.json`
  
- **Firehose**: All tools visible immediately, 17 servers
  - Copy contents of `mcp-config-firehose.json`

**Then:**
1. Open Augment Settings Panel (gear icon)
2. Click "Import from JSON" in MCP section
3. Paste the JSON
4. Click Save

### 2️⃣ Paste Instructions

1. Open Augment Settings Panel
2. Find "Instructions" text area
3. Paste contents of `augment-instructions.txt`
4. Click Save

### 3️⃣ Restart VS Code

Close all windows and restart VS Code completely.

---

## 🎯 What You Get

### Lean Config (4 servers, ~50 meta-tools)

```
✅ architect-mcp          (6 tools)   - Planning with local LLMs
✅ autonomous-agent-mcp   (7 tools)   - Code generation with local LLMs
✅ credit-optimizer-mcp   (32 tools)  - Autonomous workflow execution
✅ robinsons-toolkit-mcp  (5 tools)   - Meta-discovery of 900+ tools
```

**Why Lean?**
- Architect plans (cheap, uses local Ollama)
- Optimizer executes autonomously (no "continue?" stalls)
- Toolkit discovers/proxies 900+ tools on demand
- Agent uses local LLMs for heavy codegen (saves credits)

### Firehose Config (17 servers, 900+ tools)

All of the above PLUS:
```
✅ github-mcp             (199 tools) - Repos, issues, PRs, actions
✅ vercel-mcp             (49 tools)  - Deployments, domains, env vars
✅ neon-mcp               (145 tools) - PostgreSQL database management
✅ playwright-mcp         (42 tools)  - Browser automation
✅ twilio-mcp             (70 tools)  - SMS, voice, messaging
✅ resend-mcp             (49 tools)  - Transactional email
✅ cloudflare-mcp         (78 tools)  - DNS, workers, KV, R2
✅ redis-mcp              (20 tools)  - Caching, sessions
✅ openai-mcp             (30 tools)  - GPT-4, DALL-E, embeddings
✅ google-workspace-mcp   (tools)     - Gmail, Drive, Calendar
✅ sequential-thinking    (4 tools)   - Reasoning
✅ context7-mcp           (3 tools)   - Context management
✅ unified-mcp            (615 tools) - Monolith server (alternative)
```

---

## 📋 Golden Path (Enforced by Instructions)

The `augment-instructions.txt` file enforces this workflow:

```
1. PLAN (Architect MCP)
   └─> architect-mcp.plan_work({ goal, depth:"fast", budgets })
   └─> Returns: { plan_id, summary }

2. EXPORT (Architect MCP)
   └─> architect-mcp.export_workplan_to_optimizer({ plan_id })
   └─> Returns: { workflow }

3. EXECUTE (Credit Optimizer MCP)
   └─> credit-optimizer-mcp.execute_autonomous_workflow(workflow)
   └─> Runs autonomously (no "continue?" prompts)
```

**Cost Control:**
- Default depth = "fast" (escalate only when needed)
- Prefer local LLMs via `autonomous-agent-mcp` for heavy work
- Use tool discovery via `credit-optimizer-mcp` (0-AI indexing)
- Never dump megabyte results (use IDs/handles + paging)

---

## 🔧 Prerequisites

### Required:
- ✅ All packages built: `npm run build`
- ✅ All packages linked: `cd packages/<name> && npm link`
- ✅ Ollama running: `http://localhost:11434`
- ✅ Ollama models pulled:
  ```bash
  ollama pull qwen2.5:3b
  ollama pull deepseek-coder:33b
  ollama pull qwen2.5-coder:32b
  ```

### Optional (for Firehose config):
- API keys for integrations (GitHub, Vercel, Neon, etc.)
- See `AUGMENT_BRINGUP_CHECKLIST.md` for full list

---

## ✅ Verification

After setup, verify everything works:

### 1. Check MCP Servers Loaded
- Open Augment panel
- Look for "MCP Servers" section
- Should show 4 servers (Lean) or 17 servers (Firehose)
- Each should show tool count (not "0 tools available")

### 2. Run Diagnostics
```
Call: robinsons-toolkit-mcp.diagnose_environment
```

Expected output:
```json
{
  "manifest_count": 912,
  "mounted_count": 912,
  "missing_env": [],
  "dropped_tools": []
}
```

### 3. Test Golden Path
```
1. Call: architect-mcp.plan_work({ 
     goal: "Add a hello world function",
     depth: "fast",
     budgets: { max_steps: 5, time_ms: 60000, max_files_changed: 1 }
   })

2. Call: architect-mcp.export_workplan_to_optimizer({ plan_id: "<from step 1>" })

3. Call: credit-optimizer-mcp.execute_autonomous_workflow({ workflow: "<from step 2>" })
```

---

## 🐛 Troubleshooting

### "0 tools available"
```bash
# Verify bins are correct
node verify-bins.mjs

# Should show 17 valid servers with 0 issues
```

### Tools missing from Toolkit
```bash
# Run diagnostics
npx robinsons-toolkit-mcp
# Then call: diagnose_environment
# Check "missing_env" array
```

### Architect/Agent fails
```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Should return list of models
```

**Full troubleshooting guide:** See `AUGMENT_BRINGUP_CHECKLIST.md`

---

## 📚 Architecture

### 4-Server Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Augment Code                            │
│                                                             │
│  User Request                                               │
│       ↓                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. ARCHITECT MCP (Planning)                         │   │
│  │    - Uses local Ollama (qwen2.5:3b)                 │   │
│  │    - Returns plan_id (not full plan)                │   │
│  │    - Cached repo maps (SQLite)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│       ↓                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. CREDIT OPTIMIZER MCP (Execution)                 │   │
│  │    - Autonomous workflow executor                   │   │
│  │    - 0-AI tool discovery (SQLite index)             │   │
│  │    - No "continue?" prompts                         │   │
│  └─────────────────────────────────────────────────────┘   │
│       ↓                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. AUTONOMOUS AGENT MCP (Heavy Codegen)             │   │
│  │    - Delegates to local LLMs                        │   │
│  │    - Saves credits on heavy work                    │   │
│  └─────────────────────────────────────────────────────┘   │
│       ↓                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 4. ROBINSON'S TOOLKIT MCP (Tool Discovery)          │   │
│  │    - Meta-server for 900+ tools                     │   │
│  │    - Lazy-loads integrations                        │   │
│  │    - Proxies to actual integration servers          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Cost Optimization

- **Planning**: Local Ollama (free) instead of GPT-4
- **Execution**: Autonomous (no back-and-forth)
- **Codegen**: Local LLMs (free) for heavy work
- **Discovery**: SQLite indexing (0-AI)
- **Results**: Handle-based (no megabyte dumps)

---

## 📖 Documentation

- **Setup Checklist**: `AUGMENT_BRINGUP_CHECKLIST.md`
- **Verify Script**: `verify-bins.mjs`
- **Lean Config**: `mcp-config-lean.json`
- **Firehose Config**: `mcp-config-firehose.json`
- **Instructions**: `augment-instructions.txt`

---

## 🎉 Success Criteria

After setup, you should have:

- ✅ 4 servers (Lean) or 17 servers (Firehose) loaded in Augment
- ✅ 900+ tools available (via Toolkit discovery)
- ✅ Golden path working (plan → export → execute)
- ✅ Autonomous execution (no "continue?" prompts)
- ✅ Local LLM delegation working
- ✅ Zero "0 tools available" errors

---

## 💡 Tips

1. **Start with Lean**: Faster, cheaper, easier to debug
2. **Add integrations later**: Switch to Firehose when you need specific tools
3. **Use diagnostics**: `diagnose_environment` is your friend
4. **Check Ollama**: Most issues are Ollama not running or models not pulled
5. **Read the checklist**: `AUGMENT_BRINGUP_CHECKLIST.md` has all the details

---

## 🔗 Links

- **Repository**: https://github.com/christcr2012/robinsonai-mcp-servers
- **Augment Docs**: https://docs.augmentcode.com/setup-augment/mcp
- **MCP Protocol**: https://modelcontextprotocol.io/

---

**Ready to go!** Import a config, paste the instructions, restart VS Code, and you're done. 🚀

