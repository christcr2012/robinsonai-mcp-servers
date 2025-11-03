# RAD Crawler Quick Start

Get RAD Crawler running in 5 minutes.

## Prerequisites

- Neon Postgres account (free tier: https://neon.tech)
- Ollama installed and running
- Robinson AI MCP servers installed

## 1. Install & Build (1 minute)

```bash
cd packages/rad-crawler-mcp
npm install
npm run build
```

## 2. Set Up Database (2 minutes)

### Get Neon Connection String

1. Go to https://console.neon.tech
2. Create project (or use existing)
3. Copy connection string from dashboard

### Enable pgvector & Run Schema

In Neon SQL Editor:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Then paste entire contents of schema.sql
```

## 3. Configure Environment (1 minute)

Create `.env`:

```bash
NEON_DATABASE_URL=postgres://user:pass@host.neon.tech/dbname?sslmode=require
OLLAMA_BASE_URL=http://127.0.0.1:11434
RAD_DEFAULT_EMBED_MODEL=bge-small
RAD_EMBEDDING_DIM=384
```

## 4. Install Ollama Models (1 minute)

```bash
ollama pull bge-small          # Embeddings (384 dim)
ollama pull qwen2.5-coder:1.5b # Planning
```

## 5. Test It

```bash
# Terminal 1: Start worker
npm run worker

# Terminal 2: Run smoke test
node test-smoke.mjs
```

Expected output:
```
✓ MCP server started
✓ Stats: { pages: 0, repos: 0, chunks: 0, ... }
✓ Policy created: 1
✓ Job created: 1
✅ All smoke tests passed!
```

## 6. Add to Augment

Edit `augment-mcp-config.json`:

```json
{
  "mcpServers": {
    "rad-crawler-mcp": {
      "command": "rad-crawler-mcp",
      "args": [],
      "env": {
        "NEON_DATABASE_URL": "postgres://...",
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    }
  }
}
```

Restart Augment.

## First Crawl

Ask Augment:

```
"Use RAD Crawler to index the Vercel edge functions documentation at docs.vercel.com"
```

Augment will:
1. Set governance policy
2. Plan the crawl
3. Seed the job
4. Monitor progress
5. Report completion

Then search:

```
"Search RAD index for: How to deploy edge middleware on Vercel?"
```

## Common Commands

```bash
# Start worker (keep running)
npm run worker

# Run smoke tests
node test-smoke.mjs

# Check logs
tail -f worker.log

# Rebuild after changes
npm run build
```

## Troubleshooting

### "NEON_DATABASE_URL is required"
→ Set in `.env` file

### "Failed to generate embedding"
→ Start Ollama: `ollama serve`

### "Model not found"
→ Pull model: `ollama pull bge-small`

### Jobs stuck in 'queued'
→ Start worker: `npm run worker`

## Next Steps

- Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup
- Read [ASSISTANT_INSTRUCTIONS.md](./ASSISTANT_INSTRUCTIONS.md) for usage patterns
- Read [README.md](./README.md) for full documentation

## Example Workflows

### Index Documentation

```typescript
// Set governance
await govern({
  allowlist: ["docs.vercel.com"],
  budgets: { max_pages_per_job: 50 }
});

// Seed crawl
const { job_id } = await seed({
  urls: ["https://docs.vercel.com/functions/edge-functions"]
});

// Wait for completion
// Then search
const results = await search({
  q: "edge middleware examples",
  semantic: true
});
```

### Search Code Repository

```typescript
// Ingest repo
const { job_id } = await ingest_repo({
  repo_url: "https://github.com/vercel/next.js",
  include: ["packages/next/src/**/*.ts"]
});

// Wait for completion
// Then search
const results = await search({
  q: "middleware implementation",
  semantic: true
});
```

### Check Index Stats

```typescript
const stats = await index_stats();
// { pages: 150, repos: 2, chunks: 3420, tokens: 1.2M, ... }
```

## Performance Tips

- Use FTS for exact matches, semantic for concepts
- Set reasonable budgets (max_pages: 50-100 for docs)
- Use `get_doc_chunk` for large documents
- Keep worker running for best performance
- Monitor with `index_stats()` regularly

## Support

- Issues: https://github.com/robinsonai/robinsonai-mcp-servers/issues
- Docs: See README.md and SETUP_GUIDE.md

