# Robinson's Context Engine (RCE)

**Production-grade context engine with hybrid search, multiple embedding providers, and intelligent model selection.**

## 🎯 Features

- **Hybrid Search**: Vector similarity + Lexical BM25 for best results
- **Multiple Providers**: OpenAI, Claude/Voyage, Ollama (FREE)
- **Intelligent Model Selection**: Best quality for best price
- **Graceful Degradation**: Works without API keys (lexical-only mode)
- **Cost Tracking**: Know exactly what you're spending
- **Zero Lock-in**: Switch providers anytime

---

## 🚀 Quick Start

### 1. Install

```bash
npm install @robinson_ai_systems/robinsons-context-engine
```

### 2. Configure (Choose Your Provider)

#### Option A: OpenAI (Recommended - Best Value)
```bash
export EMBED_PROVIDER=openai
export OPENAI_API_KEY=sk-...
export EMBED_MODEL=text-embedding-3-small  # $0.02/1M tokens
```

#### Option B: Claude/Voyage (Best for Code)
```bash
export EMBED_PROVIDER=voyage
export VOYAGE_API_KEY=...
export EMBED_MODEL=voyage-code-2  # $0.10/1M tokens
```

#### Option C: Ollama (FREE - Local)
```bash
export EMBED_PROVIDER=ollama
export OLLAMA_BASE_URL=http://localhost:11434
export EMBED_MODEL=nomic-embed-text  # FREE!
```

#### Option D: Auto (Smart Selection)
```bash
export EMBED_PROVIDER=auto  # Tries OpenAI → Voyage → Ollama → None
```

#### Option E: None (Lexical Search Only)
```bash
export EMBED_PROVIDER=none  # No embeddings, BM25 only
```

### 3. Use

```typescript
import { RobinsonsContextEngine } from '@robinson_ai_systems/robinsons-context-engine';

const rce = new RobinsonsContextEngine('/path/to/repo');

// Index repository
await rce.indexRepo('/path/to/repo');

// Search
const results = await rce.search('authentication middleware', 10);

// Get stats
const stats = await rce.stats();
console.log(stats);
// {
//   sources: 1234,
//   chunks: 5678,
//   vectors: 5678,
//   mode: 'openai',
//   model: 'text-embedding-3-small',
//   dimensions: 1536,
//   totalCost: 0.0234,
//   indexedAt: '2025-11-03T...'
// }
```

---

## 💰 Cost Comparison

| Provider | Model | Cost/1M Tokens | Dimensions | Quality | Speed |
|----------|-------|----------------|------------|---------|-------|
| **OpenAI** | text-embedding-3-small | $0.02 | 1536 | ⭐⭐⭐⭐ | ⚡⚡⚡ |
| **OpenAI** | text-embedding-3-large | $0.13 | 3072 | ⭐⭐⭐⭐⭐ | ⚡⚡ |
| **Voyage** | voyage-code-2 | $0.10 | 1536 | ⭐⭐⭐⭐⭐ | ⚡⚡ |
| **Voyage** | voyage-3 | $0.12 | 1024 | ⭐⭐⭐⭐⭐ | ⚡⚡ |
| **Ollama** | nomic-embed-text | FREE | 768 | ⭐⭐⭐ | ⚡ |
| **Ollama** | mxbai-embed-large | FREE | 1024 | ⭐⭐⭐ | ⚡ |

**Recommendation:**
- **Best Value**: OpenAI text-embedding-3-small ($0.02/1M)
- **Best Quality**: Voyage voyage-code-2 ($0.10/1M) or OpenAI text-embedding-3-large ($0.13/1M)
- **FREE**: Ollama nomic-embed-text (requires local Ollama)

---

## 🎛️ Advanced Configuration

### Intelligent Model Selection

```typescript
const rce = new RobinsonsContextEngine('/path/to/repo', {
  provider: 'auto',           // Auto-select best available
  preferQuality: true,        // Use best model regardless of cost
  maxCostPer1M: 0.10         // Max cost per 1M tokens
});
```

**How it works:**
1. If `preferQuality=true` and budget allows → Use best model
2. If `preferQuality=false` → Use cheapest model that meets quality threshold
3. If no API keys → Fall back to Ollama or lexical-only

### Environment Variables

```bash
# Provider Selection
EMBED_PROVIDER=auto|openai|voyage|claude|ollama|none

# Quality vs Cost
EMBED_PREFER_QUALITY=1              # Use best model (default: 0)
EMBED_MAX_COST_PER_1M=0.10         # Max cost per 1M tokens (default: 0.10)

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1/embeddings
EMBED_MODEL=text-embedding-3-small  # or text-embedding-3-large

# Voyage/Claude
VOYAGE_API_KEY=...
ANTHROPIC_API_KEY=...               # Alternative to VOYAGE_API_KEY
VOYAGE_BASE_URL=https://api.voyageai.com/v1/embeddings
EMBED_MODEL=voyage-code-2           # or voyage-3

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
EMBED_MODEL=nomic-embed-text        # or mxbai-embed-large
```

---

## 📊 Example: Indexing a Large Repo

```typescript
const rce = new RobinsonsContextEngine('/path/to/large-repo', {
  provider: 'openai',
  preferQuality: false,  // Use cheapest model
  maxCostPer1M: 0.05    // Max $0.05/1M tokens
});

const result = await rce.indexRepo('/path/to/large-repo');

console.log(result);
// {
//   files: 2500,
//   chunks: 12000,
//   vectors: 12000,
//   cost: 0.24  // $0.24 total
// }
```

**Cost Breakdown:**
- 12,000 chunks × ~100 tokens/chunk = 1.2M tokens
- 1.2M tokens × $0.02/1M = $0.024
- **Total: $0.024** (2.4 cents!)

---

## 🔍 Search Quality

### Hybrid Search (Vector + Lexical)

```typescript
const results = await rce.search('JWT authentication middleware', 10);

results.forEach(hit => {
  console.log(`${hit.uri} (score: ${hit.score})`);
  console.log(`  ${hit.snippet}`);
  console.log(`  Method: ${hit._method}`);  // 'vector', 'lexical', or 'hybrid'
});
```

### Graceful Degradation

If embeddings fail or aren't configured, RCE automatically falls back to lexical search:

```typescript
// No API keys configured
const rce = new RobinsonsContextEngine('/path/to/repo');
await rce.indexRepo('/path/to/repo');

// Still works! Uses BM25 lexical search
const results = await rce.search('authentication', 10);
// results[0]._method === 'lexical'
```

---

## 🛠️ API Reference

### `RobinsonsContextEngine`

#### Constructor
```typescript
new RobinsonsContextEngine(root: string, config?: EmbedderConfig)
```

#### Methods

**`indexRepo(root: string, exts?: string[])`**
- Index repository files
- Returns: `{ files, chunks, vectors, cost }`

**`search(query: string, k?: number)`**
- Hybrid search (vector + lexical)
- Returns: `RCESearchHit[]`

**`stats()`**
- Get index statistics
- Returns: `RCEStats`

**`reset()`**
- Clear index and start fresh

**`ensureIndexed()`**
- Ensure repository is indexed (idempotent)

---

## 🎯 Use Cases

### 1. Code Search
```typescript
const results = await rce.search('error handling middleware');
```

### 2. Documentation Search
```typescript
const results = await rce.search('how to deploy to production');
```

### 3. API Discovery
```typescript
const results = await rce.search('user authentication endpoints');
```

### 4. Dependency Analysis
```typescript
const results = await rce.search('import statements for database');
```

---

## 🔒 Privacy & Security

- **Local-First**: All data stored locally in `.rce_index/`
- **No Telemetry**: Zero tracking or analytics
- **API Keys**: Never logged or stored
- **Open Source**: Audit the code yourself

---

## 📈 Performance

- **Indexing**: ~1000 files/minute (with embeddings)
- **Search**: <100ms for most queries
- **Memory**: Streaming architecture, handles large repos
- **Storage**: ~1KB per chunk (JSONL format)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

## 🙏 Credits

Built by [Robinson AI Systems](https://robinsonaisystems.com) with ❤️

Powered by:
- OpenAI Embeddings API
- Voyage AI Embeddings API
- Ollama (local embeddings)

