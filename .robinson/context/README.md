# Context Engine Storage

Context Engine storage lives here. Chunks/embeddings are JSONL for portability. Safe to delete and rebuild.

## Structure

- `chunks.jsonl` - Text chunks with metadata
- `embeddings.jsonl` - Vector embeddings for each chunk
- `stats.json` - Index statistics
- `web/` - Cached web content
- `repo/` - Repository-specific data
- `graph/` - Import graph data

## Rebuilding

To rebuild the index:

```bash
npm run ctx:reset
npm run ctx:index
```

