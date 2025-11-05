# MCP Critical Issues Analysis

## Issue #1: Thinking Tools MCP Showing Zero Tools

### Root Cause
**Status:** NEEDS INVESTIGATION - Build succeeds, tools are defined in registry, but not being exposed to Augment

### Evidence
1. ✅ Build succeeds: `npm run build` completes without errors
2. ✅ Registry populated: 32+ tools defined in `src/index.ts` registry object
3. ✅ ListToolsRequestSchema handler exists and maps registry to tools array
4. ❌ Augment reports 0 tools available

### Possible Causes
1. **Runtime Error During Initialization** - Tool descriptors might be failing to import
   - Check: `contextIndexRepoDescriptor`, `contextQueryDescriptor`, etc.
   - These use computed property names: `[contextIndexRepoDescriptor.name]`
   - If descriptor.name is undefined, tool won't be registered

2. **MCP Protocol Issue** - Server might not be responding to tools/list request
   - Need to check Augment's MCP logs
   - Server starts and logs "Starting server with X tools"

3. **Environment Variable Issue** - Missing WORKSPACE_ROOT or other required env vars
   - Server uses `buildServerContext()` which needs workspace root
   - Check augment-mcp-config.json for required env vars

### Next Steps
1. Check Augment MCP logs for errors
2. Add debug logging to see how many tools are in registry at runtime
3. Test server directly with MCP protocol messages
4. Verify all tool descriptors export `.name` property

---

## Issue #2: Robinson's Toolkit - Google Tools Not Callable

### Root Cause
**CONFIRMED:** Tools are defined but NEVER registered in the ToolRegistry

### Evidence
1. ✅ Tools defined in ListToolsRequestSchema handler (lines 1396-1587)
2. ✅ Tool handlers exist (gmail_send_message, gmail_get_profile, etc.)
3. ❌ **NO CODE TO REGISTER TOOLS IN REGISTRY**
4. ❌ `toolkit_call` fails with "Unknown tool" because registry.hasTool() returns false

### The Bug
```typescript
// In constructor (line 112):
this.registry = new ToolRegistry();  // ✅ Registry created

// But NOWHERE in the code is this called:
this.registry.registerTool('google', {
  name: 'gmail_send_message',
  description: '...',
  inputSchema: {...}
});
```

### Why It Fails
1. `toolkit_discover` works - it searches the hardcoded tools array
2. `toolkit_get_tool_schema` works - it searches the hardcoded tools array  
3. `toolkit_call` FAILS - it checks `registry.hasTool()` which returns false

### The Fix
Need to add a method that registers all tools from the ListToolsRequestSchema handler into the registry:

```typescript
private registerAllTools(): void {
  // Get all tools from the ListToolsRequestSchema handler
  const allTools = this.getAllToolDefinitions();
  
  // Register each tool in the appropriate category
  for (const tool of allTools) {
    const category = this.registry.inferCategory(tool.name);
    if (category) {
      this.registry.registerTool(category, tool);
    }
  }
  
  console.error(`[Robinson Toolkit] Registered ${allTools.length} tools`);
}
```

Call this in constructor after creating the registry.

---

## Impact

### Thinking Tools MCP
- **Severity:** CRITICAL
- **Impact:** Entire server unusable - 0 tools available
- **Users Affected:** All users (including you)
- **Workaround:** None

### Robinson's Toolkit Google Tools
- **Severity:** HIGH
- **Impact:** 192 Google Workspace tools unusable
- **Users Affected:** Anyone trying to use Gmail, Drive, Calendar, Sheets, Docs, Admin tools
- **Workaround:** Use standalone google-workspace-mcp server

---

## Recommended Action Plan

### Priority 1: Fix Robinson's Toolkit (Easier, Clear Root Cause)
1. Add `registerAllTools()` method to UnifiedToolkit class
2. Call it in constructor after creating registry
3. Test with `toolkit_call` for gmail_get_profile
4. Publish new version
5. Update augment-mcp-config.json

### Priority 2: Debug Thinking Tools MCP (Harder, Unknown Root Cause)
1. Add extensive debug logging
2. Check Augment MCP logs
3. Test server directly with MCP protocol
4. Verify tool descriptor imports
5. Fix and publish

---

## Your SMTP Info (Temporary Solution)

Since Google tools aren't working, here are your standard Google Workspace SMTP settings:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587 (TLS/STARTTLS - recommended)
           OR 465 (SSL)
Encryption: TLS/STARTTLS (for port 587)
           OR SSL (for port 465)
Authentication: Required
Username: [Your full Google Workspace email]
Password: [Your Google password OR App-Specific Password]
```

**To create App-Specific Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Click "Generate"
4. Use the 16-character password

---

## Next Steps

**What would you like me to do?**

1. **Fix Robinson's Toolkit first** (I can do this now - clear fix)
2. **Debug Thinking Tools MCP** (Need to investigate further)
3. **Both in parallel** (Fix Toolkit, then debug Thinking Tools)

Let me know and I'll proceed!

