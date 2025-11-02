# Thinking Tools MCP v1.4.6 Update

**Date:** 2025-11-02  
**Package:** `@robinson_ai_systems/thinking-tools-mcp@1.4.6`  
**Status:** ✅ Published to npm

---

## 🎯 What's New in v1.4.6

This release implements critical fixes for workspace root detection, file validation, and adds new web context tools.

### New Features

1. **Web Context Tools** 🌐
   - `ctx_web_search` - Web search via Brave/Serper APIs
   - `ctx_web_crawl_step` - Fetch and extract readable content from URLs

2. **Enhanced Evidence Collection** 📁
   - `think_collect_evidence` - Improved with strict validation
   - `think_auto_packet` - Create markdown packets with validation

3. **Health & Validation Tools** 🔍
   - `toolkit_health_check` - Verify toolkit status
   - `toolkit_validate_tools` - Validate tool names against Augment's regex

### Bug Fixes

1. **Workspace Root Detection** ✅
   - Fixed: MCP servers searching VS Code install directory instead of workspace
   - Solution: `resolveWorkspaceRoot()` checks env vars → git → upward search
   - Supports: AUGMENT_WORKSPACE_ROOT, WORKSPACE_ROOT, WORKSPACE_FOLDER

2. **Windows Path Normalization** ✅
   - Fixed: Backslashes causing JSON/cross-platform issues
   - Solution: `normalize()` converts all paths to forward slashes

3. **File Write Validation** ✅
   - Fixed: Tools returning ok:true but files not created
   - Solution: Strict validation (verify file exists and size > 0 after write)

4. **Tool Name Validation** ✅
   - Fixed: Augment rejecting tool definitions with invalid names
   - Solution: `safeName()` validates against regex `^[a-zA-Z0-9_.:-]{1,64}$`

---

## 📦 Installation

### For Users (npm)
```bash
npm install -g @robinson_ai_systems/thinking-tools-mcp@1.4.6
```

### For Development (local)
```bash
cd packages/thinking-tools-mcp
npm install
npm run build
```

---

## 🔧 Configuration

### Augment MCP Settings

Add to your Augment MCP configuration:

```json
{
  "mcpServers": {
    "thinking-tools-mcp": {
      "command": "thinking-tools-mcp",
      "args": [],
      "env": {
        "AUGMENT_WORKSPACE_ROOT": "${workspaceFolder}",
        "BRAVE_API_KEY": "your-brave-api-key-optional",
        "SERPER_API_KEY": "your-serper-api-key-optional"
      }
    }
  }
}
```

**Environment Variables:**
- `AUGMENT_WORKSPACE_ROOT` - Workspace root path (recommended)
- `WORKSPACE_ROOT` - Alternative workspace root
- `WORKSPACE_FOLDER` - Alternative workspace root
- `BRAVE_API_KEY` - For web search via Brave API (optional)
- `SERPER_API_KEY` - For web search via Serper API (optional)

---

## 🧪 Testing

### Test Workspace Root Detection
```javascript
think_collect_evidence({
  maxFiles: 10
})
// Should return: root: "C:/Users/chris/Git Local/robinsonai-mcp-servers"
```

### Test Auto Packet Creation
```javascript
think_auto_packet({
  slug: "test-packet",
  sections: {
    "Summary": "This is a test",
    "Findings": "Everything works!"
  }
})
// Should create: .robctx/thinking/test-packet.md
```

### Test Web Search (requires API key)
```javascript
ctx_web_search({
  q: "MCP protocol",
  limit: 5
})
// Should return: { ok: true, provider: "brave", items: [...] }
```

### Test Web Crawl
```javascript
ctx_web_crawl_step({
  url: "https://example.com"
})
// Should create: .robctx/web/{hash}.md
```

### Test Health Check
```javascript
toolkit_health_check()
// Should return: { ok: true, count: 6, names: [...] }
```

### Test Validation
```javascript
toolkit_validate_tools()
// Should return: { ok: true, total: 6, invalid: [] }
```

---

## 📝 Files Changed

### New Files
- `src/lib/workspace.ts` - Workspace root detection
- `src/tools/think_collect_evidence.ts` - Evidence collector
- `src/tools/think_auto_packet.ts` - Packet creator
- `src/tools/ctx_web_search.ts` - Web search
- `src/tools/ctx_web_crawl_step.ts` - Web crawler

### Modified Files
- `src/tools/collect_evidence.ts` - Updated to export new tools
- `src/index.ts` - Added new tool handlers
- `package.json` - Version bump to 1.4.6

---

## 🔄 Migration from v1.4.5

No breaking changes. Simply update to v1.4.6:

```bash
npm install -g @robinson_ai_systems/thinking-tools-mcp@1.4.6
```

Then restart Augment to pick up the new version.

---

## 🐛 Known Issues

None at this time.

---

## 📚 Documentation

- [HANDOFF_DOCUMENT.md](./HANDOFF_DOCUMENT.md) - Full system documentation
- [QUICK_START_NEXT_CHAT.md](./QUICK_START_NEXT_CHAT.md) - Quick start guide
- [README.md](./README.md) - Package overview

---

## 🙏 Credits

**Author:** Robinson AI Systems  
**Contributors:** Augment AI, User feedback  
**License:** MIT

---

## 📞 Support

For issues or questions:
1. Check the documentation
2. Review test examples above
3. Open an issue on GitHub
4. Contact Robinson AI Systems

---

**Published:** 2025-11-02  
**npm:** https://www.npmjs.com/package/@robinson_ai_systems/thinking-tools-mcp  
**Version:** 1.4.6

