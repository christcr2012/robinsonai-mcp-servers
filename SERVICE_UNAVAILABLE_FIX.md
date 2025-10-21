# Service Unavailable Error - Root Cause & Solution

## Problem Summary

After fixing the duplicate tool names and reinstalling all MCP servers, the AI assistant responds with "service unavailable" error codes. When all MCP servers are uninstalled, the assistant works normally.

## Root Cause Analysis

### Primary Issue: Resource Overload
Loading **all 9 MCP servers simultaneously** with **592 total tools** overwhelms the MCP client:

| Server | Tools | Status |
|--------|-------|--------|
| GitHub MCP | 240 | ✅ Essential |
| Neon MCP | 160 | ✅ Essential |
| Google Workspace MCP | 192 | ⚠️ Slow auth |
| Vercel MCP | ~50 | ✅ Essential |
| Redis MCP | ~80 | ⚠️ Requires Redis running |
| OpenAI MCP | ~120 | ⚠️ File I/O on startup |
| Cloudflare MCP | ~60 | ✅ Optional |
| Resend MCP | ~40 | ✅ Optional |
| Twilio MCP | ~50 | ✅ Optional |
| **TOTAL** | **~592** | **Too many!** |

### Secondary Issues

#### 1. Redis MCP Hanging
- **Problem**: Tries to connect to `redis://localhost:6379` on startup
- **Impact**: If Redis isn't running, connection hangs indefinitely
- **Result**: MCP client timeout → service unavailable

#### 2. Google Workspace MCP Slow Authentication
- **Problem**: Service account authentication can take 3-5 seconds
- **Impact**: Delays overall MCP initialization
- **Result**: Timeout if combined with other slow servers

#### 3. Initialization Timeout
- **Problem**: MCP client has a timeout for server initialization (typically 10-30 seconds)
- **Impact**: With 9 servers, total initialization time exceeds timeout
- **Result**: Service unavailable error

---

## Solution: Phased Loading Approach

### Step 1: Start with Essential Servers Only

Load only the **3 most critical servers** first:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/github-mcp/dist/index.js"],
      "env": { "GITHUB_TOKEN": "your_token_here" }
    },
    "vercel": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/vercel-mcp/dist/index.js"],
      "env": { "VERCEL_TOKEN": "your_token_here" }
    },
    "neon": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/neon-mcp/dist/index.js"],
      "env": { "NEON_API_KEY": "your_key_here" }
    }
  }
}
```

**Total Tools**: ~450 tools  
**Expected Result**: ✅ Should work without issues

### Step 2: Add Communication Servers (If Needed)

If you need email/SMS functionality, add:

```json
{
  "mcpServers": {
    "resend": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/resend-mcp/dist/index.js"],
      "env": { "RESEND_API_KEY": "your_key_here" }
    }
  }
}
```

**Total Tools**: ~490 tools  
**Expected Result**: ✅ Should still work

### Step 3: Add Infrastructure Servers (Carefully)

Only add if actively needed:

```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/cloudflare-mcp/dist/index.js"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your_token_here",
        "CLOUDFLARE_ACCOUNT_ID": "your_account_id"
      }
    }
  }
}
```

**Total Tools**: ~550 tools  
**Expected Result**: ⚠️ Monitor for slowdowns

### Step 4: Avoid Problematic Servers

**DO NOT load these unless absolutely necessary:**

#### Redis MCP
- ❌ Only load if you have Redis server running
- ❌ Will hang if Redis isn't available
- ❌ Adds significant initialization time

#### Google Workspace MCP
- ❌ Slow service account authentication
- ❌ Complex credential setup
- ❌ Can timeout on initialization

#### OpenAI MCP
- ⚠️ File I/O on startup (cost tracking)
- ⚠️ Can slow initialization
- ✅ OK to load if you need OpenAI tools

---

## Diagnostic Tool

Run the diagnostic script to identify which servers are causing issues:

```bash
node test-mcp-servers.js
```

This will:
1. Test each server individually
2. Identify servers that hang or timeout
3. Provide specific recommendations
4. Show which servers are safe to load

---

## Recommended Configurations

### For Most Users (Web Development)
```json
{
  "mcpServers": {
    "github": { ... },
    "vercel": { ... },
    "neon": { ... }
  }
}
```
**Tools**: ~450 | **Performance**: ✅ Excellent

### For Full-Stack Development
```json
{
  "mcpServers": {
    "github": { ... },
    "vercel": { ... },
    "neon": { ... },
    "resend": { ... },
    "cloudflare": { ... }
  }
}
```
**Tools**: ~540 | **Performance**: ✅ Good

### Maximum Recommended
```json
{
  "mcpServers": {
    "github": { ... },
    "vercel": { ... },
    "neon": { ... },
    "resend": { ... },
    "cloudflare": { ... },
    "openai": { ... }
  }
}
```
**Tools**: ~580 | **Performance**: ⚠️ Monitor closely

---

## Quick Fix Checklist

- [ ] Remove all MCP servers from configuration
- [ ] Add only GitHub, Vercel, and Neon
- [ ] Restart MCP client and test
- [ ] If working, add one server at a time
- [ ] Test after each addition
- [ ] Stop when you reach 5-6 servers max
- [ ] Never load Redis MCP unless Redis is running
- [ ] Avoid Google Workspace MCP unless essential

---

## Why This Happens

1. **MCP Client Limits**: Most MCP clients have initialization timeouts (10-30 seconds)
2. **Cumulative Delays**: Each server adds 1-3 seconds of initialization time
3. **Network Calls**: Servers that validate credentials add network latency
4. **Service Dependencies**: Servers requiring external services (Redis) can hang
5. **Tool Registration**: 592 tools is a lot to register at once

**Bottom Line**: Loading all 9 servers exceeds the MCP client's capacity.

---

## Long-Term Solution

Consider creating **server profiles** for different workflows:

### Profile 1: Development
- GitHub, Vercel, Neon

### Profile 2: DevOps
- GitHub, Cloudflare, Neon, Redis

### Profile 3: Communication
- GitHub, Resend, Twilio

Switch profiles based on your current task instead of loading everything at once.

---

## Next Steps

1. **Run diagnostic**: `node test-mcp-servers.js`
2. **Start minimal**: Load only GitHub, Vercel, Neon
3. **Test thoroughly**: Verify AI assistant works
4. **Add incrementally**: One server at a time
5. **Monitor**: Watch for slowdowns or errors
6. **Optimize**: Keep only what you actively use

See `MCP_TROUBLESHOOTING.md` for detailed troubleshooting steps.

