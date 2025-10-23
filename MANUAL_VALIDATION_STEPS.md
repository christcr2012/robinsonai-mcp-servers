# RAD Integration - Manual Validation Steps

## Prerequisites

Before testing, ensure you have:

1. ✅ **Robinson's Toolkit MCP globally linked**
   ```bash
   cd packages/robinsons-toolkit-mcp
   npm link
   ```

2. ✅ **Ollama running with required models**
   ```bash
   ollama pull bge-small
   ollama pull qwen2.5-coder:1.5b
   ```

3. ✅ **Neon database set up**
   - Create a Neon project
   - Run `packages/robinsons-toolkit-mcp/src/rad/schema.sql` in Neon SQL Editor
   - Get your connection string

---

## Step 1: Configure Augment MCP Settings

1. Open **Augment Code**
2. Go to **Settings** → **MCP Servers**
3. **Remove** `rad-crawler-mcp` if it exists
4. **Update** `robinsons-toolkit-mcp` configuration:

```json
{
  "robinsons-toolkit-mcp": {
    "command": "robinsons-toolkit-mcp",
    "args": [],
    "env": {
      "NEON_DATABASE_URL": "postgres://user:pass@host.neon.tech/dbname?sslmode=require",
      "OLLAMA_BASE_URL": "http://localhost:11434"
    }
  }
}
```

5. **Save** and **Restart Augment**

---

## Step 2: Verify Tools Are Available

In Augment chat, ask:

```
"List all available MCP tools that start with 'rad.'"
```

**Expected output:** You should see 11 tools:
- rad.plan_crawl
- rad.seed
- rad.crawl_now
- rad.ingest_repo
- rad.status
- rad.search
- rad.get_doc
- rad.get_doc_chunk
- rad.govern
- rad.index_stats
- rad.diagnose

---

## Step 3: Run Diagnostics

In Augment chat, ask:

```
"Run the rad.diagnose tool"
```

**Expected output:**
```json
{
  "environment": {
    "neon_db": true,
    "ollama": true
  },
  "worker": {
    "started": true
  },
  "database": {
    "connected": true,
    "stats": {
      "pages": 0,
      "repos": 0,
      "chunks": 0,
      "tokens": 0
    }
  },
  "policy": {
    "active": true,
    "policy": {
      "allowlist": [],
      "denylist": ["accounts.*", "*/logout", "*/login"],
      "max_pages_per_job": 200,
      "max_depth": 3
    }
  }
}
```

**What to check:**
- ✅ `environment.neon_db` = true
- ✅ `environment.ollama` = true
- ✅ `worker.started` = true
- ✅ `database.connected` = true

---

## Step 4: Get Index Statistics

In Augment chat, ask:

```
"Run rad.index_stats"
```

**Expected output:**
```json
{
  "pages": 0,
  "repos": 0,
  "chunks": 0,
  "tokens": 0,
  "last_crawl": null,
  "storage_mb": 0,
  "sources_by_kind": {}
}
```

This confirms the database is empty and ready for crawling.

---

## Step 5: Test Crawl Planning (Optional)

In Augment chat, ask:

```
"Use rad.plan_crawl to plan indexing the Vercel Edge Functions documentation"
```

**Expected output:**
```json
{
  "plan": {
    "urls": [
      "https://vercel.com/docs/functions/edge-functions"
    ],
    "max_depth": 2,
    "max_pages": 50,
    "reasoning": "..."
  }
}
```

---

## Step 6: Test Crawl Seeding (Optional)

In Augment chat, ask:

```
"Use rad.seed to start a crawl of https://vercel.com/docs/functions/edge-functions with max_depth=1 and max_pages=10"
```

**Expected output:**
```json
{
  "job_id": 1,
  "status": "queued",
  "urls": ["https://vercel.com/docs/functions/edge-functions"],
  "max_depth": 1,
  "max_pages": 10
}
```

---

## Step 7: Check Job Status (Optional)

In Augment chat, ask:

```
"Use rad.status to check job 1"
```

**Expected output:**
```json
{
  "job_id": 1,
  "kind": "crawl",
  "state": "running",
  "progress": {
    "pages_crawled": 5,
    "pages_total": 10,
    "percent": 50
  },
  "created_at": "2025-10-22T18:00:00Z",
  "started_at": "2025-10-22T18:00:05Z"
}
```

---

## Step 8: Test Search (After Crawl Completes)

In Augment chat, ask:

```
"Use rad.search to find information about edge middleware"
```

**Expected output:**
```json
{
  "results": [
    {
      "doc_id": 1,
      "url": "https://vercel.com/docs/functions/edge-middleware",
      "title": "Edge Middleware - Vercel Docs",
      "snippet": "Edge Middleware allows you to run code before a request is processed...",
      "score": 0.85
    }
  ],
  "total": 1,
  "query": "edge middleware"
}
```

---

## Troubleshooting

### Issue: "No rad.* tools found"

**Solution:**
1. Check that `robinsons-toolkit-mcp` is globally linked:
   ```bash
   npm list -g | Select-String "robinsons-toolkit-mcp"
   ```
2. Rebuild and relink:
   ```bash
   cd packages/robinsons-toolkit-mcp
   npm run build
   npm link
   ```
3. Restart Augment

### Issue: "RAD worker not started"

**Solution:**
1. Check environment variables in Augment MCP config
2. Ensure `NEON_DATABASE_URL` and `OLLAMA_BASE_URL` are set
3. Restart Augment

### Issue: "Database connection failed"

**Solution:**
1. Verify Neon connection string is correct
2. Check that pgvector extension is enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run schema.sql in Neon SQL Editor

### Issue: "Ollama not accessible"

**Solution:**
1. Check Ollama is running:
   ```bash
   Get-Process ollama
   ```
2. Test Ollama API:
   ```bash
   Invoke-RestMethod -Uri "http://localhost:11434/api/tags"
   ```
3. Pull required models:
   ```bash
   ollama pull bge-small
   ollama pull qwen2.5-coder:1.5b
   ```

---

## Success Criteria

✅ **Integration is successful if:**

1. All 11 `rad.*` tools are visible in Augment
2. `rad.diagnose` shows:
   - Database connected
   - Worker started
   - Environment configured
3. `rad.index_stats` returns statistics (even if empty)
4. `rad.plan_crawl` generates a crawl plan
5. `rad.seed` creates a job
6. `rad.status` shows job progress
7. `rad.search` returns results (after crawl completes)

---

## Next Steps After Validation

Once validation is complete:

1. **Update Architect MCP routing** to use `rad.search` for knowledge retrieval
2. **Update Credit Optimizer** to use `rad.get_doc` for reading crawled content
3. **Test full workflow:**
   - Architect plans work → checks `rad.search` for existing knowledge
   - If knowledge is thin → calls `rad.plan_crawl` → `rad.seed`
   - Optimizer executes → reads results via `rad.get_doc`

4. **Optional: Set up Vercel API routes** for external access to RAD index

---

## Reference

- **Full setup guide:** `RAD_INTEGRATION_COMPLETE.md`
- **Schema:** `packages/robinsons-toolkit-mcp/src/rad/schema.sql`
- **Environment template:** `packages/robinsons-toolkit-mcp/.env.example`
- **Source code:** `packages/robinsons-toolkit-mcp/src/rad/`

---

## Status

- ✅ Code integration complete
- ✅ Build successful
- ✅ Globally linked
- ⏳ **Awaiting manual validation in Augment**

Once you complete these validation steps, the RAD Crawler integration will be fully operational!

