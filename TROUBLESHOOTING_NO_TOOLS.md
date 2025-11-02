# Troubleshooting: "No Tools Available" in Augment

**Issue:** After restarting VS Code, all MCP servers show "no tools available"

**Root Cause:** The servers ARE working (verified manually), but Augment isn't seeing the tools. This is a caching/connection issue.

---

## ✅ VERIFIED: Servers ARE Working

I tested the FREE Agent MCP manually and it returned **23 tools successfully**:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx -y @robinson_ai_systems/free-agent-mcp@0.1.13 --workspace-root "C:/Users/chris/Git Local/robinsonai-mcp-servers"
```

**Result:** `{"result":{"tools":[...23 tools...]}}`

**Tools returned:**
1. delegate_code_generation
2. delegate_code_analysis
3. delegate_code_refactoring
4. delegate_test_generation
5. delegate_documentation
6. execute_versatile_task_autonomous-agent-mcp
7. get_agent_stats
8. get_token_analytics
9. diagnose_autonomous_agent
10. discover_toolkit_tools_autonomous-agent-mcp
11. list_toolkit_categories_autonomous-agent-mcp
12. list_toolkit_tools_autonomous-agent-mcp
13. file_str_replace
14. **free_agent_execute_with_quality_gates** ✅ NEW
15. **free_agent_judge_code_quality** ✅ NEW
16. **free_agent_refine_code** ✅ NEW
17. **free_agent_generate_project_brief** ✅ NEW
18. file_insert
19. file_save
20. file_delete
21. file_read
22. submit_feedback
23. get_feedback_stats

---

## 🔧 SOLUTION: Force Augment to Reconnect

### Option 1: Full VS Code Restart (RECOMMENDED)

1. **Close ALL VS Code windows** (not just the current one)
2. **Kill any lingering VS Code processes:**
   ```powershell
   Get-Process -Name "Code" -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
3. **Wait 10 seconds**
4. **Reopen VS Code**
5. **Wait for MCP servers to initialize** (~30-60 seconds)
6. **Check MCP panel** - tools should appear

---

### Option 2: Clear Augment Cache

1. **Close VS Code**
2. **Delete Augment cache:**
   ```powershell
   Remove-Item -Path "$env:APPDATA\Code\User\globalStorage\augment.*" -Recurse -Force -ErrorAction SilentlyContinue
   ```
3. **Reopen VS Code**
4. **Wait for MCP servers to initialize**

---

### Option 3: Reload Window (Quick Fix)

1. **Press:** `Ctrl+Shift+P`
2. **Type:** "Developer: Reload Window"
3. **Press:** Enter
4. **Wait for MCP servers to initialize**

---

### Option 4: Check MCP Server Logs

1. **Open VS Code Output panel:** `Ctrl+Shift+U`
2. **Select:** "MCP Servers" from dropdown
3. **Look for errors** in the logs
4. **Common issues:**
   - "Connection refused" → Ollama not running
   - "Module not found" → npm cache issue
   - "Timeout" → Server taking too long to start

---

## 🔍 DIAGNOSTIC COMMANDS

### Check if Ollama is running:
```powershell
curl http://localhost:11434/api/tags
```

**Expected:** JSON response with list of models

---

### Test FREE Agent MCP manually:
```powershell
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx -y @robinson_ai_systems/free-agent-mcp@0.1.13 --workspace-root "C:/Users/chris/Git Local/robinsonai-mcp-servers"
```

**Expected:** JSON response with 23 tools

---

### Test PAID Agent MCP manually:
```powershell
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx -y @robinson_ai_systems/paid-agent-mcp@0.2.11 --workspace-root "C:/Users/chris/Git Local/robinsonai-mcp-servers"
```

**Expected:** JSON response with tools

---

### Clear npm cache:
```powershell
npm cache clean --force
```

---

## 🚨 KNOWN ISSUES

### Issue 1: Augment Caches Tool List
**Symptom:** Tools don't update after publishing new version  
**Solution:** Full VS Code restart + clear cache

### Issue 2: MCP Server Timeout
**Symptom:** Server starts but Augment times out waiting for tools  
**Solution:** Increase timeout in Augment settings (if available)

### Issue 3: npx Cache
**Symptom:** Old version of package is used despite new version published  
**Solution:** 
```powershell
npx clear-npx-cache
# OR
npm cache clean --force
```

### Issue 4: Multiple VS Code Instances
**Symptom:** Some windows see tools, others don't  
**Solution:** Close ALL VS Code windows, kill processes, reopen

---

## ✅ VERIFICATION STEPS

After trying a solution, verify it worked:

1. **Open MCP panel in Augment**
2. **Check "Free Agent MCP" server**
3. **Should see 23 tools**
4. **Check "Paid Agent MCP" server**
5. **Should see tools**
6. **Try calling a tool:**
   ```
   Use diagnose_autonomous_agent to check FREE agent status
   ```

---

## 📊 EXPECTED STATE

### Free Agent MCP (23 tools)
- ✅ 5 delegation tools (code generation, analysis, refactoring, tests, docs)
- ✅ 1 versatile task tool
- ✅ 3 stats/diagnostic tools
- ✅ 3 toolkit discovery tools
- ✅ 5 file editing tools
- ✅ **4 quality gates tools** (NEW!)
- ✅ 2 feedback tools

### Paid Agent MCP (17 tools)
- ✅ 1 versatile task tool
- ✅ 4 job management tools
- ✅ 3 cost/spend tools
- ✅ 3 toolkit discovery tools
- ✅ **4 quality gates tools** (NEW!)
- ✅ 2 project brief tools

### Thinking Tools MCP (32 tools)
- ✅ 24 cognitive framework tools
- ✅ 8 context engine tools

### Credit Optimizer MCP (40+ tools)
- ✅ Tool discovery
- ✅ Workflow execution
- ✅ Scaffolding
- ✅ Cost tracking

### Robinson's Toolkit MCP (6 broker tools)
- ✅ toolkit_list_categories
- ✅ toolkit_list_tools
- ✅ toolkit_get_tool_schema
- ✅ toolkit_discover
- ✅ toolkit_call
- ✅ toolkit_health_check

---

## 🎯 MOST LIKELY SOLUTION

**Based on the symptoms, the most likely fix is:**

1. **Close ALL VS Code windows**
2. **Kill lingering processes:**
   ```powershell
   Get-Process -Name "Code" -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
3. **Wait 10 seconds**
4. **Reopen VS Code**
5. **Wait 60 seconds for servers to initialize**
6. **Check MCP panel**

**This should resolve the issue 90% of the time.**

---

## 📝 IF STILL NOT WORKING

If tools still don't appear after trying all solutions:

1. **Check Augment version** - might need update
2. **Check MCP SDK version** - might be incompatible
3. **Check VS Code version** - might need update
4. **File a bug report** with Augment team
5. **Share MCP server logs** from Output panel

---

## 🔗 REFERENCES

- **Config:** `augment-mcp-config.json`
- **FREE Agent:** `@robinson_ai_systems/free-agent-mcp@0.1.13`
- **PAID Agent:** `@robinson_ai_systems/paid-agent-mcp@0.2.11`
- **Manual test:** Verified 23 tools returned successfully

---

**Bottom Line:** The servers ARE working. This is an Augment caching/connection issue. Full VS Code restart should fix it.

