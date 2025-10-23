# Stop MCP Servers and Complete Setup

## ⚠️ CURRENT STATUS
VS Code is still running with 17 Code.exe processes active. The MCP servers are locking `better-sqlite3.node` file.

## Instructions to Complete Setup

### Step 1: Close VS Code Completely
1. **Close ALL VS Code windows** (File → Exit, or Alt+F4 on all windows)
2. **Wait 10 seconds** for all processes to terminate
3. **Verify processes are stopped:**
   ```powershell
   Get-Process -Name "Code" -ErrorAction SilentlyContinue
   ```
   Should return **nothing** (empty output)

### Step 2: Run Complete Setup Script
Once VS Code is fully closed:
```powershell
cd "c:\Users\chris\Git Local\robinsonai-mcp-servers"
.\scripts\complete-setup.ps1
```

This will:
- ✅ Clean install all dependencies (`npm ci`)
- ✅ Build all workspace packages
- ✅ Verify all 6 core servers built successfully
- ✅ Check Ollama models are installed
- ✅ Fix 58 unmet/missing dependencies

### Step 3: Apply Hardened Configuration
1. Open VS Code
2. Go to **Settings → Tools → MCP Servers**
3. Click **Import from JSON**
4. Select `AUGMENT_6_SERVER_CONFIG_HARDENED.json`
5. Click **Save**

### Step 4: Restart and Validate
1. **Restart VS Code** (Ctrl+Shift+P → "Developer: Reload Window")
2. Check Augment panel - all 6 servers should show as connected
3. Run smoke tests from `scripts/smoke-test-6-servers.md`

---

## What This Fixes

**Problem:** The previous `npm ci` failed because better-sqlite3.node was locked by running MCP servers (architect-mcp, autonomous-agent-mcp, credit-optimizer-mcp all use SQLite databases).

**Solution:** Close VS Code → Clean install → Rebuild → Restart with hardened config

**Benefits:**
- ✅ Clean dependency installation (respects package-lock.json)
- ✅ Fixes 58 unmet/missing dependencies
- ✅ Ensures all builds are successful
- ✅ Applies safety guardrails (budget limits, concurrency controls, timeouts)

---

## Troubleshooting

### If VS Code won't close:
```powershell
# Force kill all Code processes (use with caution)
Stop-Process -Name "Code" -Force
```

### If npm ci still fails:
```powershell
# Try npm install instead
npm install
npm run build --workspaces --if-present
```

### If builds fail:
Check `docs/6-SERVER-SETUP-GUIDE.md` for detailed troubleshooting.

---

**Ready?** Close VS Code now and run `.\scripts\complete-setup.ps1`!

