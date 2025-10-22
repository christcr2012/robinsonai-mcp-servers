# ✅ Ready-to-Use MCP Configuration - COPY & PASTE

## 🚀 Fastest Method (One Command)

```powershell
.\install-config.ps1
```

Then restart VS Code. **Done!**

---

## 📋 Manual Copy-Paste Method

### Option 1: Basic (Ollama Only - Recommended)

```powershell
copy READY_TO_PASTE_CONFIG.json augment-mcp-config.json
```

### Option 2: With API Keys

```powershell
copy READY_TO_PASTE_CONFIG_WITH_INTEGRATIONS.json augment-mcp-config.json
```

Then edit `augment-mcp-config.json` and replace `YOUR_*_HERE` with real keys.

---

## 📄 The Actual Config (Copy This!)

Here's the complete config you can copy-paste directly into `augment-mcp-config.json`:

```json
{
  "mcpServers": {
    "architect-mcp": {
      "command": "node",
      "args": [
        "C:\\nvm4w\\nodejs\\node_modules\\@robinsonai\\architect-mcp\\dist\\index.js"
      ],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "ARCHITECT_FAST_MODEL": "qwen2.5:3b",
        "ARCHITECT_STD_MODEL": "deepseek-coder:33b",
        "ARCHITECT_BIG_MODEL": "qwen2.5-coder:32b"
      }
    },
    "autonomous-agent-mcp": {
      "command": "node",
      "args": [
        "C:\\nvm4w\\nodejs\\node_modules\\@robinsonai\\autonomous-agent-mcp\\dist\\index.js"
      ],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    },
    "credit-optimizer-mcp": {
      "command": "node",
      "args": [
        "C:\\nvm4w\\nodejs\\node_modules\\@robinsonai\\credit-optimizer-mcp\\dist\\index.js"
      ],
      "env": {}
    },
    "robinsons-toolkit-mcp": {
      "command": "node",
      "args": [
        "C:\\nvm4w\\nodejs\\node_modules\\@robinsonai\\robinsons-toolkit-mcp\\dist\\index.js"
      ],
      "env": {}
    }
  }
}
```

---

## ✅ What This Gives You

### 4 MCP Servers Ready to Use

1. **Architect MCP** (12 tools)
   - `plan_work` - Create strategic plans with local LLMs
   - `revise_plan` - Critique and improve plans
   - `export_workplan_to_optimizer` - Send to Credit Optimizer
   - Models: qwen2.5:3b (5s), deepseek-coder:33b (45s)

2. **Autonomous Agent MCP** (6 tools)
   - `delegate_code_generation` - Generate code with local LLMs
   - `delegate_code_analysis` - Analyze code for issues
   - `delegate_code_refactoring` - Refactor code
   - `delegate_test_generation` - Generate tests
   - 0 Augment credits used!

3. **Credit Optimizer MCP** (50+ tools)
   - `execute_autonomous_workflow` - Run workflows autonomously
   - `discover_tools` - Find tools without AI
   - `scaffold_*` - Generate components/APIs/tests
   - `execute_recipe` - Pre-built workflows
   - Skill Packs: 5 recipes, 2 blueprints

4. **Robinson's Toolkit MCP** (912 tools)
   - `diagnose_environment` - Check integrations
   - `list_integrations` - See available services
   - Works without API keys (limited)
   - Add keys to unlock: GitHub (240), Neon (160), Google (192), etc.

---

## 🔧 Configuration Explained

### Why These Paths?

```json
"command": "node",
"args": ["C:\\nvm4w\\nodejs\\node_modules\\@robinsonai\\architect-mcp\\dist\\index.js"]
```

- ✅ **Absolute paths** - Works from any directory
- ✅ **Direct to built code** - No npx overhead
- ✅ **Globally linked** - Uses your npm-linked packages
- ✅ **Fast startup** - No package resolution needed

### Why `node` instead of `npx`?

| Method | Startup Time | Reliability | Works Offline |
|--------|--------------|-------------|---------------|
| `npx @robinsonai/architect-mcp` | ~2-3 seconds | Medium | ❌ No |
| `node C:\...\dist\index.js` | ~100ms | High | ✅ Yes |

### Environment Variables

**Architect & Autonomous Agent:**
- `OLLAMA_BASE_URL` - Where Ollama is running (default: localhost:11434)
- `ARCHITECT_FAST_MODEL` - Fast planning model (5 seconds)
- `ARCHITECT_STD_MODEL` - Standard model (45 seconds)
- `ARCHITECT_BIG_MODEL` - Big model (60 seconds)

**Robinson's Toolkit (Optional):**
Add to `env` section to enable integrations:
```json
"env": {
  "GITHUB_TOKEN": "ghp_...",
  "VERCEL_TOKEN": "...",
  "NEON_API_KEY": "...",
  "OPENAI_API_KEY": "sk-..."
}
```

---

## 🧪 Test After Installation

### 1. Restart VS Code
```
Ctrl+Shift+P → "Developer: Reload Window"
```

### 2. Run Diagnostics
In Augment chat:
```
diagnose_architect
diagnose_autonomous_agent
diagnose_credit_optimizer
diagnose_environment
```

### 3. Expected Output
```
✅ Ollama connection: OK (http://localhost:11434)
✅ Models available: qwen2.5:3b, deepseek-coder:33b, qwen2.5-coder:32b
✅ Database: architect.db (WAL mode)
✅ Tool index: 615 tools
⚠️  Missing integrations: GitHub, Vercel, Neon (no API keys)
```

### 4. Try a Plan
```
plan_work goal="Add user authentication to my Next.js app" depth="fast"
```

Should return a plan in ~5 seconds!

---

## 🔥 Quick Troubleshooting

### "Server failed to start"
```powershell
# Check paths exist
dir C:\nvm4w\nodejs\node_modules\@robinsonai

# Rebuild if needed
npm run build --workspaces
```

### "Ollama connection failed"
```powershell
# Check Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if needed
ollama serve
```

### "No tools showing up"
1. Fully quit VS Code (close all windows)
2. Reopen VS Code
3. Check Output → Augment for errors

### "Want to add API keys"
Edit `augment-mcp-config.json`:
```json
"robinsons-toolkit-mcp": {
  "env": {
    "GITHUB_TOKEN": "ghp_your_real_token_here"
  }
}
```
Then restart VS Code.

---

## 📁 Files Created

1. **READY_TO_PASTE_CONFIG.json** - Basic config (Ollama only)
2. **READY_TO_PASTE_CONFIG_WITH_INTEGRATIONS.json** - Full config with API key placeholders
3. **install-config.ps1** - Automated installer script
4. **COPY_PASTE_INSTRUCTIONS.md** - Detailed instructions
5. **This file** - Quick reference

---

## 🎯 Summary

✅ **All 4 servers configured** with absolute paths  
✅ **Ollama integration** ready (localhost:11434)  
✅ **Fast startup** using direct node commands  
✅ **No API keys required** to start (add later)  
✅ **Globally linked packages** used  
✅ **Production-ready** configuration  

**Just copy the JSON above into `augment-mcp-config.json` and restart VS Code!** 🚀

---

## 💡 Pro Tips

1. **Start with basic config** - Add API keys later as needed
2. **Keep Ollama running** - Use auto-start script for convenience
3. **Use fast mode first** - qwen2.5:3b is surprisingly good
4. **Test diagnostics** - Verify everything before heavy use
5. **Backup your config** - Before making changes

**You're ready to go!** 🎉

