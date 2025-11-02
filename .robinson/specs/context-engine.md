# Task Spec: Context Engine

## Metadata
- **ID**: context-engine
- **Scope**: Index repo and answer queries
- **Entrypoint**: `npm --prefix packages/thinking-tools-mcp run ctx:index`

## Acceptance Criteria

### Check 1: Indexing Works
```bash
cd packages/thinking-tools-mcp
npm run ctx:index
```
Should complete without errors and create `.robinson/context/chunks.jsonl` and `.robinson/context/embeddings.jsonl`.

### Check 2: Querying Works
```bash
node -e "import('./packages/thinking-tools-mcp/dist/context/search.js').then(async m=>{const r=await m.hybridQuery('package.json',3); console.log(r.length); process.exit(r.length>0?0:1)})"
```
Should return >0 results.

### Check 3: MCP Tools Available
All 8 Context Engine tools should be registered:
- `context_index_repo`
- `context_query`
- `context_web_search`
- `context_ingest_urls`
- `context_stats`
- `context_reset`
- `context_neighborhood`
- `context_summarize_diff`

## Usage

### Index Repository
```javascript
context_index_repo({ repo_root: "/path/to/repo" })
```

### Query Context
```javascript
context_query({ query: "authentication implementation", top_k: 5 })
```

### Web Search & Ingest
```javascript
// Search for URLs
context_web_search({ q: "TypeScript best practices", k: 5 })

// Ingest URLs
context_ingest_urls({ 
  urls: ["https://example.com/article"], 
  tags: ["typescript", "best-practices"] 
})
```

### Code Analysis
```javascript
// Get import graph
context_neighborhood({ file: "src/index.ts" })

// Summarize changes
context_summarize_diff({ range: "HEAD~5..HEAD" })
```

