# RAD Crawler Setup Guide

Complete step-by-step guide to get RAD Crawler running in your Robinson AI system.

## Prerequisites

- Node.js 18+ installed
- Neon Postgres account (free tier works)
- Ollama installed and running locally
- Robinson AI MCP servers monorepo

## Step 1: Install Dependencies

```bash
cd packages/rad-crawler-mcp
npm install
```

## Step 2: Set Up Neon Database

### 2.1 Create Neon Project

1. Go to https://neon.tech
2. Create a new project (or use existing)
3. Copy the connection string

### 2.2 Enable pgvector

In the Neon SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2.3 Run Schema

```bash
# Set your connection string
export NEON_DATABASE_URL="postgres://user:pass@host.neon.tech/dbname?sslmode=require"

# Run schema
psql $NEON_DATABASE_URL < schema.sql
```

Or copy/paste the contents of `schema.sql` into the Neon SQL Editor.

## Step 3: Set Up Ollama

### 3.1 Install Ollama

```bash
# Windows
winget install Ollama.Ollama

# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### 3.2 Pull Required Models

```bash
# Embedding model (choose one)
ollama pull bge-small          # 384 dimensions, fast
# OR
ollama pull nomic-embed-text   # 768 dimensions, better quality

# Code generation model (for plan_crawl)
ollama pull qwen2.5-coder:1.5b
```

### 3.3 Start Ollama

```bash
ollama serve
```

Keep this running in a separate terminal.

## Step 4: Configure Environment

Create `.env` file in `packages/rad-crawler-mcp/`:

```bash
# Required
NEON_DATABASE_URL=postgres://user:pass@host.neon.tech/dbname?sslmode=require

# Optional (defaults shown)
OLLAMA_BASE_URL=http://127.0.0.1:11434
RAD_DEFAULT_EMBED_MODEL=bge-small
RAD_MAX_PAGES=200
RAD_MAX_DEPTH=3
RAD_RATE_PER_DOMAIN_PER_MIN=10
RAD_ALLOWLIST=
RAD_DENYLIST=accounts.*,*/logout,*/login
RAD_RESPECT_ROBOTS=true
RAD_CHUNK_SIZE=1024
RAD_CHUNK_OVERLAP=150
RAD_EMBEDDING_DIM=384
```

**Important:** Set `RAD_EMBEDDING_DIM` to match your model:
- `bge-small`: 384
- `nomic-embed-text`: 768
- `all-minilm`: 384

## Step 5: Build the Package

```bash
npm run build
```

## Step 6: Test the Installation

```bash
# Run smoke tests
node test-smoke.mjs
```

Expected output:
```
✓ MCP server started
✓ Stats: { pages: 0, repos: 0, chunks: 0, ... }
✓ Policy created: 1
✓ Job created: 1
✓ Job status: queued
✓ Search results: 0
✅ All smoke tests passed!
```

## Step 7: Start the Worker

In a separate terminal:

```bash
cd packages/rad-crawler-mcp
npm run worker
```

Keep this running to process crawl jobs.

## Step 8: Add to Augment Config

Edit your Augment MCP config (usually `augment-mcp-config.json`):

```json
{
  "mcpServers": {
    "rad-crawler-mcp": {
      "command": "npx",
      "args": ["rad-crawler-mcp"],
      "env": {
        "NEON_DATABASE_URL": "postgres://...",
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    }
  }
}
```

Or if using the monorepo bin:

```json
{
  "mcpServers": {
    "rad-crawler-mcp": {
      "command": "rad-crawler-mcp",
      "args": []
    }
  }
}
```

## Step 9: Verify in Augment

Restart Augment and verify RAD Crawler tools are available:

```
Ask Augment: "List available RAD Crawler tools"
```

You should see:
- plan_crawl
- seed
- crawl_now
- ingest_repo
- status
- search
- get_doc
- get_doc_chunk
- govern
- index_stats

## Step 10: First Crawl

Try a simple crawl:

```
Ask Augment: "Use RAD Crawler to index the Vercel edge functions documentation"
```

Augment should:
1. Create a governance policy
2. Plan the crawl
3. Seed the job
4. Monitor progress
5. Report when complete

## Troubleshooting

### "NEON_DATABASE_URL is required"

Make sure you've set the environment variable in your `.env` file or Augment config.

### "Failed to generate embedding: connect ECONNREFUSED"

Ollama is not running. Start it with `ollama serve`.

### "type 'vector' does not exist"

pgvector extension not enabled. Run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Jobs stuck in 'queued' state

Worker is not running. Start it with `npm run worker`.

### "Model not found"

Pull the required model:
```bash
ollama pull bge-small
ollama pull qwen2.5-coder:1.5b
```

### Worker crashes with "out of memory"

Reduce chunk size or use a smaller embedding model:
```bash
RAD_CHUNK_SIZE=512
RAD_DEFAULT_EMBED_MODEL=bge-small
```

## Performance Tuning

### For Fast Crawling

```bash
RAD_MAX_PAGES=50
RAD_MAX_DEPTH=2
RAD_RATE_PER_DOMAIN_PER_MIN=20
```

### For Deep Analysis

```bash
RAD_MAX_PAGES=500
RAD_MAX_DEPTH=4
RAD_CHUNK_SIZE=1024
```

### For Low Memory

```bash
RAD_CHUNK_SIZE=512
RAD_DEFAULT_EMBED_MODEL=bge-small
RAD_EMBEDDING_DIM=384
```

## Next Steps

1. **Set up governance** - Define allowed domains for your use case
2. **Crawl key docs** - Index documentation you frequently reference
3. **Ingest repos** - Add your codebase for semantic code search
4. **Create workflows** - Combine RAD with Architect and Optimizer
5. **Deploy API** - Use Vercel routes for external access

## Advanced: Vercel API Deployment

To make RAD Crawler accessible via HTTPS:

1. Copy `vercel-api-example/` to your Vercel project
2. Add `NEON_DATABASE_URL` to Vercel environment variables
3. Deploy: `vercel deploy`
4. Access via `https://your-app.vercel.app/api/rad/query`

## Support

- GitHub Issues: https://github.com/robinsonai/robinsonai-mcp-servers/issues
- Documentation: See README.md and ASSISTANT_INSTRUCTIONS.md

