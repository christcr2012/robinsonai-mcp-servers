# RAD Crawler MCP Server

**Retrieval-Augmented Development Crawler** - A powerful MCP server for web crawling, code repository ingestion, and semantic search using local Ollama models.

## Features

- 🕷️ **Web Crawling** with governance (allow/deny lists, robots.txt, rate limits)
- 📦 **Repository Ingestion** for code analysis and search
- 🔍 **Hybrid Search** - Full-text search (FTS) + semantic search (pgvector)
- 🤖 **Local AI** - Uses Ollama for embeddings, classification, and summaries (zero cloud credits!)
- 💾 **Neon Postgres** - Scalable storage with pgvector for semantic search
- 🎯 **Smart Deduplication** - Content hashing to avoid reprocessing
- 📊 **Job Queue** - Async processing with progress tracking

## Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Set up environment variables
cp .env.example .env
# Edit .env with your Neon database URL and Ollama settings
```

## Database Setup

1. Create a Neon Postgres database
2. Enable pgvector extension in Neon SQL console:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run the schema:
   ```bash
   psql $NEON_DATABASE_URL < schema.sql
   ```

## Environment Variables

```bash
# Required
NEON_DATABASE_URL=postgres://user:pass@host/db

# Optional (with defaults)
OLLAMA_BASE_URL=http://127.0.0.1:11434
RAD_DEFAULT_EMBED_MODEL=bge-small
RAD_MAX_PAGES=200
RAD_MAX_DEPTH=3
RAD_RATE_PER_DOMAIN_PER_MIN=10
RAD_ALLOWLIST=example.com,docs.myapp.com
RAD_DENYLIST=accounts.*,*/logout,*/login
RAD_RESPECT_ROBOTS=true
RAD_CHUNK_SIZE=1024
RAD_CHUNK_OVERLAP=150
RAD_EMBEDDING_DIM=768
```

## Usage

### Start the MCP Server

```bash
npm start
```

### Start the Worker (for processing jobs)

```bash
npm run worker
```

### Add to Augment Config

```json
{
  "mcpServers": {
    "rad-crawler-mcp": {
      "command": "npx",
      "args": ["rad-crawler-mcp"]
    }
  }
}
```

Windows (VS Code Augment) – prefer absolute executables:

```json
{
  "mcpServers": {
    "rad-crawler-mcp": {
      "command": "C:\\nvm4w\\nodejs\\rad-crawler-mcp.cmd",
      "args": []
    }
  }
}
```

Or explicit node + dist entry (no global link required):

```json
{
  "mcpServers": {
    "rad-crawler-mcp": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\chris\\Git Local\\robinsonai-mcp-servers\\packages\\rad-crawler-mcp\\dist\\index.js"
      ]
    }
  }
}
```

## MCP Tools

### `plan_crawl`
Plan a web crawl from a high-level goal using local LLM.

```typescript
{
  goal: "Collect Vercel edge functions documentation",
  scope?: "vercel.com/docs",
  depth?: "fast" | "thorough"
}
// Returns: { job_id, plan_summary }
```

### `seed`
Seed a crawl job with explicit URLs and rules.

```typescript
{
  urls: ["https://vercel.com/docs"],
  allow?: ["vercel.com", "nextjs.org"],
  deny?: ["*/login", "*/logout"],
  max_depth?: 3,
  max_pages?: 200,
  recrawl_days?: 7
}
// Returns: { job_id, status }
```

### `crawl_now`
Force start a queued crawl job.

```typescript
{ job_id: 123 }
// Returns: { status, job_id }
```

### `ingest_repo`
Ingest a code repository for analysis.

```typescript
{
  repo_url: "https://github.com/vercel/next.js",
  branch?: "main",
  include?: ["src/**/*.ts"],
  exclude?: ["**/__tests__/**"]
}
// Returns: { job_id, status }
```

### `status`
Get job status and progress.

```typescript
{ job_id: 123 }
// Returns: { job_id, kind, state, progress, ... }
```

### `search`
Search the RAD index.

```typescript
{
  q: "How to deploy Next.js edge functions?",
  top_k?: 10,
  semantic?: false  // true for vector search
}
// Returns: { results: [...], count, query }
```

### `get_doc`
Get full document (limited to 10KB).

```typescript
{ doc_id: 456 }
// Returns: { doc_id, uri, title, text, ... }
```

### `get_doc_chunk`
Get document chunk (paged retrieval).

```typescript
{
  doc_id: 456,
  offset: 0,
  limit: 5000
}
// Returns: { chunk, total_length, has_more }
```

### `govern`
Update governance policy.

```typescript
{
  allowlist?: ["vercel.com", "nextjs.org"],
  denylist?: ["*/logout"],
  budgets?: {
    max_pages_per_job: 100,
    max_depth: 2,
    rate_per_domain: 5
  }
}
// Returns: { policy_id, allowlist, denylist, budgets }
```

### `index_stats`
Get index statistics.

```typescript
{}
// Returns: { pages, repos, chunks, tokens, storage_mb, ... }
```

## Architecture

```
┌─────────────────┐
│  Augment Agent  │
└────────┬────────┘
         │ MCP
         ▼
┌─────────────────┐      ┌──────────────┐
│  RAD Crawler    │─────▶│    Ollama    │
│   MCP Server    │      │  (Embeddings)│
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│     Worker      │─────▶│     Neon     │
│  (Job Processor)│      │  (Postgres)  │
└─────────────────┘      └──────────────┘
```

## Workflow Example

```typescript
// 1. Create governance policy
await govern({
  allowlist: ["docs.vercel.com"],
  budgets: { max_pages_per_job: 50, max_depth: 2 }
});

// 2. Plan and seed crawl
const { job_id } = await plan_crawl({
  goal: "Collect Vercel edge functions docs"
});

// 3. Check status
const status = await status({ job_id });

// 4. Search when done
const results = await search({
  q: "How to use edge middleware?",
  semantic: true,
  top_k: 5
});

// 5. Get full document
const doc = await get_doc({ doc_id: results[0].doc_id });
```

## Cost Optimization

- **Zero cloud credits** - All AI work runs on local Ollama
- **Smart caching** - Content hashing prevents reprocessing
- **Efficient chunking** - 1024 tokens with 15% overlap
- **Batch embeddings** - Process multiple chunks together
- **FTS first** - Use full-text search before semantic search

## License

MIT

