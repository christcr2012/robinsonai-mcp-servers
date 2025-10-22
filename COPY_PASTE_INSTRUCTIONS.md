# 📋 Ready-to-Paste MCP Configuration

## Quick Copy-Paste (No API Keys)

**File:** `READY_TO_PASTE_CONFIG.json`

This config is **ready to use right now** with just Ollama (no external API keys needed).

### Copy Command:
```powershell
copy READY_TO_PASTE_CONFIG.json augment-mcp-config.json
```

Then restart VS Code.

---

## With API Keys (Optional Integrations)

**File:** `READY_TO_PASTE_CONFIG_WITH_INTEGRATIONS.json`

This includes placeholders for all integrations. Replace `YOUR_*_HERE` with your actual keys.

### Steps:

1. **Copy the file:**
```powershell
copy READY_TO_PASTE_CONFIG_WITH_INTEGRATIONS.json augment-mcp-config.json
```

2. **Edit `augment-mcp-config.json`** and replace placeholders:
   - `YOUR_GITHUB_TOKEN_HERE` → Your GitHub token (get from https://github.com/settings/tokens)
   - `YOUR_VERCEL_TOKEN_HERE` → Your Vercel token
   - `YOUR_NEON_API_KEY_HERE` → Your Neon API key
   - etc.

3. **Remove unused integrations** - Delete any lines for services you don't use

4. **Restart VS Code**

---

## What's Configured

### ✅ All 4 Servers Ready

1. **Architect MCP** (12 tools)
   - Strategic planning with local LLMs
   - Models: qwen2.5:3b (fast), deepseek-coder:33b (standard), qwen2.5-coder:32b (big)
   - Requires: Ollama running on localhost:11434

2. **Autonomous Agent MCP** (6 tools)
   - Code generation with local LLMs
   - 0 Augment credits used!
   - Requires: Ollama running on localhost:11434

3. **Credit Optimizer MCP** (50+ tools)
   - Autonomous workflows
   - Tool discovery, templates, caching
   - Skill packs (recipes + blueprints)
   - No external dependencies

4. **Robinson's Toolkit MCP** (912 tools)
   - GitHub, Vercel, Neon, Google Workspace, Redis, OpenAI, etc.
   - Works without API keys (limited functionality)
   - Add API keys to unlock full features

---

## Configuration Details

### Paths Used
All configs use **absolute paths** to your globally-linked packages:
```
C:\nvm4w\nodejs\node_modules\@robinsonai\{package-name}\dist\index.js
```

This ensures VS Code Augment can find the servers regardless of working directory.

### Command Format
```json
{
  "command": "node",
  "args": ["C:\\nvm4w\\nodejs\\node_modules\\@robinsonai\\architect-mcp\\dist\\index.js"],
  "env": { ... }
}
```

**Why `node` instead of `npx`?**
- Faster startup (no package resolution)
- More reliable (direct path to built code)
- Works with globally-linked packages

---

## Verify Installation

After copying the config and restarting VS Code:

1. **Open Augment Chat** in VS Code
2. **Run diagnostic commands:**
   ```
   diagnose_architect
   diagnose_autonomous_agent
   diagnose_credit_optimizer
   diagnose_environment
   ```

3. **Expected output:**
   - ✅ Ollama connection: OK
   - ✅ Models available: qwen2.5:3b, deepseek-coder:33b, etc.
   - ✅ Database paths: architect.db, credit-optimizer.db, etc.
   - ⚠️ Missing integrations: (if no API keys configured)

---

## Troubleshooting

### "Server failed to start"
1. Check Ollama is running: `curl http://localhost:11434/api/tags`
2. Verify paths exist: `dir C:\nvm4w\nodejs\node_modules\@robinsonai`
3. Check build output: `npm run build --workspaces`

### "No tools available"
1. Restart VS Code completely (close all windows)
2. Check Augment extension is enabled
3. Look for errors in Output → Augment

### "Ollama connection failed"
1. Start Ollama: `ollama serve` or use your auto-start script
2. Verify URL: `http://localhost:11434` (not https)
3. Check firewall isn't blocking port 11434

### "Missing API keys"
- This is OK! Servers work without API keys
- Add keys to `robinsons-toolkit-mcp` → `env` section
- Only add keys for services you actually use

---

## Adding API Keys Later

Edit `augment-mcp-config.json` and add to the `robinsons-toolkit-mcp` → `env` section:

```json
"robinsons-toolkit-mcp": {
  "command": "node",
  "args": ["C:\\nvm4w\\nodejs\\node_modules\\@robinsonai\\robinsons-toolkit-mcp\\dist\\index.js"],
  "env": {
    "GITHUB_TOKEN": "ghp_your_actual_token",
    "OPENAI_API_KEY": "sk-your_actual_key"
  }
}
```

Then restart VS Code.

---

## Quick Reference

### File Locations
- **Config file:** `augment-mcp-config.json` (project root)
- **Databases:** `architect.db`, `credit-optimizer.db`, etc. (project root)
- **Server code:** `C:\nvm4w\nodejs\node_modules\@robinsonai\*`

### Restart VS Code
```
Ctrl+Shift+P → "Developer: Reload Window"
```

Or fully quit and reopen.

### Test Commands
```
diagnose_architect
diagnose_autonomous_agent  
diagnose_credit_optimizer
diagnose_environment
plan_work
execute_autonomous_workflow
delegate_code_generation
```

---

## Summary

✅ **Ready-to-paste configs created**  
✅ **Absolute paths configured** (no PATH issues)  
✅ **All 4 servers included**  
✅ **Ollama configured** (localhost:11434)  
✅ **API keys optional** (add later if needed)  

**Just copy the file and restart VS Code!** 🚀

