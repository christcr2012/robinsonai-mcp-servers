# RAD Crawler - Quick Start Guide

**5-minute setup for RAD Crawler integrated into Robinson's Toolkit MCP**

---

## Prerequisites

- ✅ Ollama installed and running
- ✅ Neon account (free tier works)
- ✅ Augment Code installed

---

## Step 1: Install Ollama Models (2 minutes)

```bash
ollama pull bge-small
ollama pull qwen2.5-coder:1.5b
```

---

## Step 2: Set Up Neon Database (2 minutes)

1. Go to https://neon.tech and create a free project
2. In Neon SQL Editor, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Then paste the entire contents of:
   ```
   packages/robinsons-toolkit-mcp/src/rad/schema.sql
   ```
4. Copy your connection string (looks like `postgres://user:pass@host.neon.tech/dbname?sslmode=require`)

---

## Step 3: Configure Augment (1 minute)

1. Open **Augment Code**
2. Go to **Settings** → **MCP Servers**
3. Find `robinsons-toolkit-mcp` and update its env:

```json
{
  "robinsons-toolkit-mcp": {
    "command": "robinsons-toolkit-mcp",
    "args": [],
    "env": {
      "NEON_DATABASE_URL": "YOUR_NEON_CONNECTION_STRING_HERE",
      "OLLAMA_BASE_URL": "http://localhost:11434"
    }
  }
}
```

4. **Important:** If you see `rad-crawler-mcp` in the list, **DELETE IT**
5. Save and **Restart Augment**

---

## Step 4: Verify (30 seconds)

In Augment chat, ask:

```
"Run rad.diagnose"
```

You should see:
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
    "connected": true
  }
}
```

✅ **If all values are `true`, you're ready to go!**

---

## Step 5: Test It Out

### Index some documentation:

```
"Use rad.plan_crawl to plan indexing the Vercel Edge Functions documentation"
```

Then:

```
"Use rad.seed to start the crawl with the plan you just created"
```

Wait 30 seconds, then:

```
"Use rad.search to find information about edge middleware"
```

---

## Common Commands

| What you want | Ask Augment |
|---------------|-------------|
| Check system health | "Run rad.diagnose" |
| See what's indexed | "Run rad.index_stats" |
| Plan a crawl | "Use rad.plan_crawl to plan indexing [topic]" |
| Start a crawl | "Use rad.seed to crawl [URLs]" |
| Check job status | "Use rad.status for job [id]" |
| Search the index | "Use rad.search to find [query]" |
| Update governance | "Use rad.govern to set allowlist to [domains]" |

---

## Troubleshooting

### "RAD worker not started"
- Check that `NEON_DATABASE_URL` and `OLLAMA_BASE_URL` are set in Augment MCP config
- Restart Augment

### "Database connection failed"
- Verify your Neon connection string is correct
- Make sure you ran the schema.sql file
- Check that pgvector extension is enabled

### "Ollama not accessible"
- Make sure Ollama is running: `Get-Process ollama`
- Test: `Invoke-RestMethod -Uri "http://localhost:11434/api/tags"`

### "No rad.* tools found"
- Make sure you **removed** `rad-crawler-mcp` from Augment config
- Only `robinsons-toolkit-mcp` should have RAD env vars
- Restart Augment

---

## What's Next?

1. **Index your favorite docs** - Use `rad.plan_crawl` to index documentation sites
2. **Ingest your repos** - Use `rad.ingest_repo` to index your code
3. **Search semantically** - Use `rad.search` with `semantic: true` for AI-powered search
4. **Set governance** - Use `rad.govern` to control what gets crawled

---

## Full Documentation

- **Complete guide:** `RAD_INTEGRATION_COMPLETE.md`
- **Validation steps:** `MANUAL_VALIDATION_STEPS.md`
- **Summary:** `INTEGRATION_SUMMARY.md`

---

## Architecture

RAD Crawler is now **integrated into Robinson's Toolkit MCP** as the 13th integration:

```
Robinson's Toolkit MCP (923 tools)
├── Meta tools (5)
├── GitHub (199)
├── Vercel (150)
├── Neon (145)
├── ... (other integrations)
└── RAD Crawler (11) ← rad.* namespace
    ├── rad.plan_crawl
    ├── rad.seed
    ├── rad.crawl_now
    ├── rad.ingest_repo
    ├── rad.status
    ├── rad.search
    ├── rad.get_doc
    ├── rad.get_doc_chunk
    ├── rad.govern
    ├── rad.index_stats
    └── rad.diagnose
```

---

## That's It!

You now have a production-ready RAD Crawler integrated into your Robinson AI system.

**Total setup time:** ~5 minutes  
**Total tools:** 923 across 4 MCP servers  
**RAD tools:** 11 (rad.*)

Happy crawling! 🚀

