# 🚀 Deployment Checklist - Get Everything Running

## Prerequisites
- [ ] Neon database account (you have this)
- [ ] Cloudflare Redis account (you have this)
- [ ] Fly.io account (you have this)
- [ ] OpenAI API key (you have this)
- [ ] Ollama installed and running locally

## Step 1: Deploy Multi-Tenant Schema to Neon

1. Open Neon Console: https://console.neon.tech
2. Select your database
3. Click "SQL Editor"
4. Copy entire contents of `packages/robinsons-toolkit-mcp/src/rad/schema-multitenant.sql`
5. Paste into SQL Editor
6. Click "Run"
7. **IMPORTANT:** Copy the generated API key from the output:
   ```sql
   -- Look for this in the results:
   INSERT INTO tenants ... VALUES ('Default Tenant', 'rad_XXXXX...', ...)
   ```
8. Save that API key - you'll need it!

**Verify:**
```sql
-- Run this to confirm schema is deployed:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should see: chunks, crawler_instances, doc_blobs, documents, 
-- jobs, policy, sources, tenant_usage, tenants
```

## Step 2: Get Your Redis URL

1. Open Cloudflare Dashboard
2. Go to Workers & Pages → KV/Durable Objects/R2 → Redis (or wherever your Redis is)
3. Copy the connection URL
4. Format: `redis://default:PASSWORD@HOST:PORT`

**Test connection:**
```bash
# Install redis-cli if needed
redis-cli -u "your_redis_url" ping
# Should return: PONG
```

## Step 3: Update Environment Variables

**Option A: Add to Augment Config (Recommended)**

Edit `WORKING_AUGMENT_CONFIG.json`:
```json
{
  "mcpServers": {
    "robinsons-toolkit-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/robinsons-toolkit-mcp"],
      "env": {
        "NEON_DATABASE_URL": "postgresql://user:pass@host/db",
        "REDIS_URL": "redis://default:pass@host:port",
        "RAD_API_KEY": "rad_XXXXX..."
      }
    },
    "autonomous-agent-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/autonomous-agent-mcp"],
      "env": {
        "MAX_OLLAMA_CONCURRENCY": "5",
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    },
    "openai-worker-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/openai-worker-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "MONTHLY_BUDGET": "25",
        "MAX_OPENAI_CONCURRENCY": "10"
      }
    }
  }
}
```

**Option B: Add to .env file**
```bash
# Database
NEON_DATABASE_URL=postgresql://user:pass@host/db

# Redis
REDIS_URL=redis://default:pass@host:port

# RAD Crawler
RAD_API_KEY=rad_XXXXX...

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
MAX_OLLAMA_CONCURRENCY=5

# OpenAI
OPENAI_API_KEY=sk-...
MONTHLY_BUDGET=25
MAX_OPENAI_CONCURRENCY=10
```

## Step 4: Restart VS Code

1. Save all files
2. Close VS Code completely
3. Reopen VS Code
4. Wait for Augment to initialize (check status bar)

**Verify servers started:**
- Look for "6 MCP servers connected" in Augment status
- Check VS Code Output panel → Augment Code

## Step 5: Test Token Tracking

**Test Autonomous Agent:**
```typescript
// In Augment chat:
"Use autonomous-agent-mcp to generate a simple React button component"

// Then check analytics:
"Show me token analytics from autonomous-agent-mcp for today"
```

**Expected output:**
```json
{
  "total_operations": 1,
  "total_tokens": 6912,
  "total_cost": 0.00,
  "avg_tokens_per_operation": 6912,
  "database_path": "~/.robinsonai/autonomous-agent/token-usage.db",
  "note": "All Ollama operations are FREE - $0.00 cost"
}
```

**Test OpenAI Worker:**
```typescript
// In Augment chat:
"Use openai-worker-mcp mini-worker to summarize this: [paste some text]"

// Then check analytics:
"Show me token analytics from openai-worker-mcp for today"
```

**Expected output:**
```json
{
  "total_operations": 1,
  "total_tokens": 234,
  "total_cost": 0.0012,
  "avg_tokens_per_operation": 234,
  "database_path": "~/.robinsonai/openai-worker/token-usage.db",
  "note": "Real OpenAI costs - track your spending!"
}
```

## Step 6: Test Coordination Tools

**Push a task:**
```typescript
"Use robinsons-toolkit-mcp to push a crawl task for https://example.com with priority 8"
```

**Check queue:**
```typescript
"Show me queue stats from robinsons-toolkit-mcp"
```

**Acquire a lock:**
```typescript
"Use robinsons-toolkit-mcp to acquire lock on https://example.com/page1 for worker-1"
```

**Check lock:**
```typescript
"Check if https://example.com/page1 is locked"
```

## Step 7: Test RAD Crawler (Multi-Tenant)

**Seed a URL:**
```typescript
"Use robinsons-toolkit-mcp rad.seed to add https://docs.example.com"
```

**Plan a crawl:**
```typescript
"Use robinsons-toolkit-mcp rad.plan_crawl for https://docs.example.com with max_pages 50"
```

**Check status:**
```typescript
"Show me RAD crawler index stats"
```

## Troubleshooting

### Servers not starting?
```bash
# Check Augment logs
# VS Code → Output → Augment Code

# Common issues:
# 1. Missing env vars → Add to config
# 2. Ollama not running → Start Ollama
# 3. Invalid API keys → Check keys
```

### Token tracking not working?
```bash
# Check database exists
ls ~/.robinsonai/autonomous-agent/token-usage.db
ls ~/.robinsonai/openai-worker/token-usage.db

# If missing, run a task first to create it
```

### Redis connection failing?
```bash
# Test connection
redis-cli -u "$REDIS_URL" ping

# Check firewall/network
# Cloudflare Redis requires TLS
```

### Neon connection failing?
```bash
# Test connection
psql "$NEON_DATABASE_URL" -c "SELECT 1"

# Check connection string format
# Should be: postgresql://user:pass@host/db?sslmode=require
```

## Success Criteria

✅ All 6 servers show "connected" in Augment
✅ Token analytics returns data after running tasks
✅ Queue stats shows empty queue (or tasks if you pushed any)
✅ RAD crawler can seed URLs and plan crawls
✅ Lock acquisition works and prevents duplicate locks

## Next Steps After Deployment

1. **Run some tasks** - Generate code, analyze files, crawl sites
2. **Check analytics daily** - See what tasks cost
3. **Optimize spending** - Use Ollama for heavy work, OpenAI for precision
4. **Scale up** - Add more crawlers when ready (Phase 2)
5. **Deploy to Fly.io** - Host crawlers in cloud (Phase 3)

## 🎉 You're Live!

Once all checkboxes are ✅, you have:
- Token tracking on all operations
- Multi-tenant RAD crawler
- Distributed coordination
- Cost awareness
- 6 servers working together

**Start building!** 🚀

