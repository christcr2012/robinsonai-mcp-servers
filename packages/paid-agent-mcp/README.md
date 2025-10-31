# OpenAI Worker MCP

Cost-controlled cloud execution for bulk tasks using OpenAI models.

## Purpose

Do work, not think. Apply diffs, format code, summarize text, rename symbols, and perform small edits using OpenAI's fast, cheap models.

## Sub-Agents

### mini-worker (gpt-4o-mini)
- **Cost:** $0.00015 per 1K input tokens
- **Speed:** Very fast
- **Use for:** Bulk edits, formatting, simple transforms

### balanced-worker (gpt-4o)
- **Cost:** $0.0025 per 1K input tokens
- **Speed:** Fast
- **Use for:** Complex refactors, API design

### premium-worker (o1-mini)
- **Cost:** $0.003 per 1K input tokens
- **Speed:** Slow (reasoning model)
- **Use for:** Security reviews, complex planning
- **Note:** Requires approval

## Tools

### run_job
Execute a single job with specified agent.

```javascript
openai_worker.run_job({
  agent: 'mini-worker',
  task: 'Format this TypeScript code: ...',
  input_refs: ['src/file.ts'],
  caps: { max_tokens: 4096 }
});
```

### queue_batch
Queue multiple jobs for batch processing (cheaper, slower).

```javascript
openai_worker.queue_batch({
  jobs: [
    { agent: 'mini-worker', task: 'Format file 1' },
    { agent: 'mini-worker', task: 'Format file 2' },
    // ... more jobs
  ]
});
```

### get_job_status
Check status of a job.

```javascript
openai_worker.get_job_status({ job_id: 'job_123' });
```

### get_spend_stats
Get monthly spend statistics.

```javascript
openai_worker.get_spend_stats();
// Returns:
{
  current_month: 5.23,
  total_budget: 25,
  remaining: 19.77,
  percentage_used: 20.9
}
```

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=sk-proj-...           # Your OpenAI API key
MONTHLY_BUDGET=25                     # Monthly budget cap (USD)
MAX_OPENAI_CONCURRENCY=2              # Max concurrent jobs
PER_JOB_TOKEN_LIMIT=8192              # Max tokens per job
```

### MCP Configuration

```json
{
  "mcpServers": {
    "openai-worker-mcp": {
      "command": "openai-worker-mcp",
      "args": [],
      "env": {
        "OPENAI_API_KEY": "sk-proj-...",
        "MONTHLY_BUDGET": "25",
        "MAX_OPENAI_CONCURRENCY": "2",
        "PER_JOB_TOKEN_LIMIT": "8192"
      }
    }
  }
}
```

## Budget Protection

### Monthly Cap
- Hard limit at `MONTHLY_BUDGET` (default: $25)
- Jobs rejected if budget exceeded
- Resets on 1st of each month

### Per-Job Limit
- Max tokens per job: `PER_JOB_TOKEN_LIMIT` (default: 8192)
- Prevents runaway costs on single jobs

### Concurrency Control
- Max concurrent jobs: `MAX_OPENAI_CONCURRENCY` (default: 2)
- Prevents rate limit issues

## Database

Jobs and spend tracked in SQLite database:
- **Location:** `packages/openai-worker-mcp/data/openai-worker.db`
- **Tables:** `jobs`, `spend`
- **Retention:** All history (for auditing)

## Build

```bash
npm install
npm run build
```

## Link

```bash
npm link
```

## Usage with Architect

Architect MCP automatically routes work to OpenAI Worker when:
1. Task is classified as bulk/format/short-copy
2. Cost forecast shows 2x speed improvement
3. Estimated cost ≤ policy cap
4. Monthly budget not exceeded

See `COST_AWARE_ROUTING_GUIDE.md` for complete workflow.

## License

MIT

