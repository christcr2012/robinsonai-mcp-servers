# RAD Crawler Assistant Instructions

Add these instructions to your Augment assistant configuration to enable optimal RAD Crawler usage.

## System Instructions

```
SYSTEM // RAD Crawler Orchestration (Robinson AI, 5 servers)

Use cases:
- Need more context from the web or a repo → use RAD Crawler tools first (cheap, local).
- Only crawl when index search doesn't answer.

Golden path:
1) Try search first:
   call rad-crawler-mcp.search({ q: <question>, top_k: 8, semantic: true })
   - If good answers: cite doc_ids and proceed.

2) If insufficient context, PLAN + SEED:
   const { job_id } = await callTool("rad-crawler-mcp","plan_crawl",{ goal: <what we need>, depth:"fast" });
   await callTool("rad-crawler-mcp","crawl_now",{ job_id });
   - Poll status(job_id) until done (add short waits, not long blocking).

3) Re-run search and use results to proceed with Architect planning or Optimizer execution.

Repo ingestion:
- Use rad-crawler-mcp.ingest_repo({ repo_url, branch?, include?, exclude? })
- Never use terminal git. For PRs, use Credit Optimizer GitHub tools (open_pr_with_changes).

Governance:
- Always obey RAD policy allow/deny, budgets, and robots.txt (default true). 
- If domain blocked, explain and ask user to add allowlist (via govern tool) before proceeding.

Output sizing:
- Return small IDs/handles (job_id, doc_id). For large content, use get_doc_chunk.

Cost & models:
- Prefer local embeddings and small local LLMs for classification; escalate only on depth:"thorough"|"forensic".
- Avoid sending raw megabyte pages into LLM prompts; use chunked, filtered text.

When to involve Architect:
- If building new features to consume crawl results, use architect-mcp.plan_work → export → optimizer execute.

Diagnostics:
- If tools appear missing: run rad-crawler-mcp.index_stats() and robinsons-toolkit-mcp.diagnose_environment; fix missing envs, then retry.
```

## Workflow Examples

### Example 1: Search-First Pattern

```typescript
// Always search before crawling
const results = await callTool("rad-crawler-mcp", "search", {
  q: "How to deploy Next.js edge functions on Vercel?",
  semantic: true,
  top_k: 5
});

if (results.count > 0) {
  // Use existing knowledge
  const doc = await callTool("rad-crawler-mcp", "get_doc", {
    doc_id: results.results[0].doc_id
  });
  // Proceed with answer
} else {
  // Need to crawl
  const { job_id } = await callTool("rad-crawler-mcp", "plan_crawl", {
    goal: "Collect Vercel edge functions documentation"
  });
  // Wait for completion, then search again
}
```

### Example 2: Governed Crawl

```typescript
// Set up governance first
await callTool("rad-crawler-mcp", "govern", {
  allowlist: ["vercel.com", "nextjs.org"],
  denylist: ["*/login", "*/logout", "accounts.*"],
  budgets: {
    max_pages_per_job: 50,
    max_depth: 2,
    rate_per_domain: 10
  }
});

// Then seed crawl
const { job_id } = await callTool("rad-crawler-mcp", "seed", {
  urls: ["https://vercel.com/docs/functions/edge-functions"],
  max_depth: 2,
  max_pages: 50
});

// Monitor progress
let status;
do {
  await sleep(5000);
  status = await callTool("rad-crawler-mcp", "status", { job_id });
  console.log(`Progress: ${status.progress?.pages_crawled}/${status.progress?.pages_total}`);
} while (status.state === 'running');
```

### Example 3: Repository Analysis

```typescript
// Ingest a repo for code search
const { job_id } = await callTool("rad-crawler-mcp", "ingest_repo", {
  repo_url: "https://github.com/vercel/next.js",
  branch: "canary",
  include: ["packages/next/src/**/*.ts"],
  exclude: ["**/__tests__/**", "**/*.test.ts"]
});

// Wait for completion
// Then search code
const results = await callTool("rad-crawler-mcp", "search", {
  q: "middleware edge runtime implementation",
  semantic: true,
  top_k: 10
});
```

## Integration with Other Servers

### With Architect MCP

```typescript
// Use RAD search to inform planning
const context = await callTool("rad-crawler-mcp", "search", {
  q: "How to implement feature flags in Next.js",
  semantic: true
});

// Then plan with context
const { plan_id } = await callTool("architect-mcp", "plan_work", {
  goal: "Implement feature flags system",
  depth: "fast",
  context: context.results.map(r => r.snippet).join('\n\n')
});
```

### With Credit Optimizer

```typescript
// RAD crawl → Optimizer workflow
const crawlJob = await callTool("rad-crawler-mcp", "seed", {
  urls: ["https://docs.example.com"]
});

// Wait for crawl to complete
// Then use Optimizer to process results
const workflow = {
  steps: [
    {
      action: "custom",
      description: "Extract API patterns from crawled docs",
      params: { source: "rad-crawler", job_id: crawlJob.job_id }
    }
  ]
};

await callTool("credit-optimizer-mcp", "execute_autonomous_workflow", { workflow });
```

## Best Practices

1. **Always search before crawling** - Avoid duplicate work
2. **Set governance early** - Prevent runaway crawls
3. **Use semantic search for concepts** - FTS for exact matches
4. **Chunk large documents** - Use `get_doc_chunk` for paging
5. **Monitor job progress** - Don't block on long crawls
6. **Respect robots.txt** - Keep `RAD_RESPECT_ROBOTS=true`
7. **Use local models** - Keep cloud costs at zero
8. **Cache results** - RAD index persists across sessions

## Troubleshooting

### Ollama Not Running
```
Error: Failed to generate embedding: connect ECONNREFUSED
Solution: Start Ollama with `ollama serve` or check OLLAMA_BASE_URL
```

### Database Connection Failed
```
Error: NEON_DATABASE_URL is required
Solution: Set NEON_DATABASE_URL in environment or .env file
```

### pgvector Not Enabled
```
Error: type "vector" does not exist
Solution: Run `CREATE EXTENSION IF NOT EXISTS vector;` in Neon SQL console
```

### Worker Not Processing Jobs
```
Jobs stuck in 'queued' state
Solution: Start worker with `npm run worker` in rad-crawler-mcp package
```

