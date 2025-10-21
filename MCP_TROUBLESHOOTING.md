# MCP Servers Troubleshooting Guide

## Problem: "Service Unavailable" Error When All Servers Are Loaded

### Symptoms
- AI assistant responds with "service unavailable" error codes
- Works fine when MCP servers are uninstalled
- Works fine with only 1-2 servers installed

### Root Causes

#### 1. **Too Many Servers/Tools Loading at Once**
- **Issue**: Loading all 9 servers with 592 tools can overwhelm the MCP client
- **Impact**: Initialization timeout, memory exhaustion, service unavailable errors

#### 2. **Redis MCP Hanging**
- **Issue**: Redis MCP tries to connect to `redis://localhost:6379` on startup
- **Impact**: If Redis server isn't running, the connection hangs indefinitely
- **Solution**: Only load Redis MCP if you have a Redis server running

#### 3. **Google Workspace MCP Authentication**
- **Issue**: Service account authentication can be slow or fail
- **Impact**: Initialization timeout if credentials are invalid or service is slow
- **Solution**: Verify credentials are correct and service account has proper permissions

#### 4. **OpenAI MCP Cost Tracking**
- **Issue**: Reads/writes cost tracking file on startup
- **Impact**: File I/O can slow initialization
- **Solution**: Ensure file path is accessible

---

## Diagnostic Approach

### Step 1: Test Servers Incrementally

Start with **essential servers only**, then add more one at a time:

#### **Tier 1: Essential Servers** (Load these first)
```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/github-mcp/dist/index.js"],
      "env": { "GITHUB_TOKEN": "your_token" }
    },
    "vercel": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/vercel-mcp/dist/index.js"],
      "env": { "VERCEL_TOKEN": "your_token" }
    },
    "neon": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/neon-mcp/dist/index.js"],
      "env": { "NEON_API_KEY": "your_key" }
    }
  }
}
```

**Test**: Restart MCP client and verify it works.

#### **Tier 2: Communication Servers** (Add if Tier 1 works)
```json
{
  "mcpServers": {
    "resend": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/resend-mcp/dist/index.js"],
      "env": { "RESEND_API_KEY": "your_key" }
    },
    "twilio": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/twilio-mcp/dist/index.js"],
      "env": {
        "TWILIO_ACCOUNT_SID": "your_sid",
        "TWILIO_AUTH_TOKEN": "your_token"
      }
    }
  }
}
```

**Test**: Restart and verify.

#### **Tier 3: Infrastructure Servers** (Add carefully)
```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/cloudflare-mcp/dist/index.js"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your_token",
        "CLOUDFLARE_ACCOUNT_ID": "your_account_id"
      }
    },
    "openai": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/openai-mcp/dist/index.js"],
      "env": { "OPENAI_API_KEY": "your_key" }
    }
  }
}
```

**Test**: Restart and verify.

#### **Tier 4: Optional Servers** (Only if needed)

**Redis MCP** - ⚠️ **ONLY load if you have Redis running**
```json
{
  "mcpServers": {
    "redis": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/redis-mcp/dist/index.js"],
      "env": { "REDIS_URL": "redis://localhost:6379" }
    }
  }
}
```

**Google Workspace MCP** - ⚠️ **Complex authentication, can be slow**
```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/google-workspace-mcp/dist/index.js"],
      "env": {
        "GOOGLE_SERVICE_ACCOUNT_KEY": "path/to/service-account-key.json",
        "GOOGLE_USER_EMAIL": "your-email@domain.com"
      }
    }
  }
}
```

---

## Step 2: Identify Problematic Servers

### Test Each Server Individually

Create a test configuration with ONLY one server at a time:

```bash
# Test GitHub MCP only
# Add only github to mcpServers, restart, test

# Test Vercel MCP only
# Add only vercel to mcpServers, restart, test

# Continue for each server...
```

**If a server causes "service unavailable":**
1. Check credentials are valid
2. Check required services are running (e.g., Redis)
3. Check for error messages in MCP client logs
4. Consider excluding that server

---

## Step 3: Common Issues & Solutions

### Issue: Redis MCP Hangs
**Symptom**: MCP client freezes or times out when Redis MCP is loaded

**Solution**:
1. Check if Redis is running: `redis-cli ping`
2. If not running, either:
   - Start Redis: `redis-server`
   - OR remove Redis MCP from configuration

### Issue: Google Workspace MCP Fails
**Symptom**: Slow initialization or authentication errors

**Solution**:
1. Verify service account key file exists and is valid
2. Verify service account has proper permissions
3. Verify user email is correct
4. Consider removing if not actively needed

### Issue: Too Many Tools
**Symptom**: MCP client becomes slow or unresponsive

**Solution**:
1. Load only the servers you actively use
2. Recommended maximum: 5-6 servers (300-400 tools)
3. Prioritize servers based on your workflow

---

## Recommended Configurations

### For Web Development
```json
{
  "mcpServers": {
    "github": { ... },
    "vercel": { ... },
    "neon": { ... },
    "cloudflare": { ... }
  }
}
```

### For Full-Stack Development
```json
{
  "mcpServers": {
    "github": { ... },
    "vercel": { ... },
    "neon": { ... },
    "openai": { ... },
    "resend": { ... }
  }
}
```

### For DevOps/Infrastructure
```json
{
  "mcpServers": {
    "github": { ... },
    "cloudflare": { ... },
    "redis": { ... },
    "neon": { ... }
  }
}
```

---

## Quick Diagnostic Checklist

- [ ] Start with 3 essential servers (GitHub, Vercel, Neon)
- [ ] Test after adding each new server
- [ ] Verify Redis is running before loading Redis MCP
- [ ] Verify Google Workspace credentials before loading Google Workspace MCP
- [ ] Check MCP client logs for error messages
- [ ] Don't load more than 5-6 servers at once
- [ ] Remove servers you don't actively use

---

## Next Steps

1. **Start minimal**: Load only GitHub, Vercel, and Neon
2. **Test thoroughly**: Verify AI assistant works properly
3. **Add incrementally**: Add one server at a time
4. **Monitor performance**: Watch for slowdowns or errors
5. **Optimize**: Keep only the servers you actively use

