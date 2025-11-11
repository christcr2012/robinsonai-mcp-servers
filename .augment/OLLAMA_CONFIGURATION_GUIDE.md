# Ollama Configuration Guide

## Overview

Ollama has been reconfigured to use **Mistral 7B** as the primary model for code generation, replacing the smaller models that were producing low-quality code.

## Current Configuration

### Models

| Model | Size | Purpose | Status |
|-------|------|---------|--------|
| **mistral:7b** | 4.1 GB | PRIMARY: Code generation | ✅ Downloaded |
| qwen2.5-coder:7b | 4.7 GB | FALLBACK: Alternative coder | ✅ Available |
| qwen2.5:3b | 1.9 GB | ROUTER: Fast routing/intent | ✅ Available |
| nomic-embed-text | 274 MB | EMBEDDINGS: Semantic search | ✅ Available |

### Removed Models

- ❌ deepseek-coder:1.3b (too small, 776 MB)
- ❌ qwen2.5:3b (too small for code, 1.9 GB) - kept for routing only
- ❌ deepseek-coder:33b (too large, 18 GB)
- ❌ qwen2.5-coder:32b (too large, 19 GB)
- ❌ codellama:34b (too large, 20 GB)

## Environment Configuration

### Location
`.env.local` (lines 5-28)

### Timeout Settings

```bash
OLLAMA_STARTUP_TIMEOUT="180"        # 3 minutes for cold start (first load)
OLLAMA_WARMUP_TIMEOUT="60"          # 1 minute for warm start (model already loaded)
OLLAMA_REQUEST_TIMEOUT="300"        # 5 minutes for individual requests
```

**Why these values?**
- **Cold start (180s)**: First time loading Mistral 7B takes 30-60 seconds on most systems
- **Warm start (60s)**: Model already in memory, just needs to process input
- **Request timeout (300s)**: Allows for complex code generation tasks

### Performance Tuning

```bash
OLLAMA_NUM_GPU="1"                  # Use GPU if available (0 = CPU only)
OLLAMA_NUM_THREAD="8"               # CPU threads to use
OLLAMA_KEEP_ALIVE="5m"              # Keep model in memory for 5 minutes
OLLAMA_MEMORY_LIMIT="12gb"          # Max memory for Ollama process
MAX_OLLAMA_CONCURRENCY="4"          # Max concurrent requests
OLLAMA_BATCH_SIZE="512"             # Batch size for processing
```

**Why these values?**
- **GPU**: Dramatically speeds up inference (10-50x faster)
- **Threads**: 8 threads is good for most systems (adjust based on CPU cores)
- **Keep-alive**: 5 minutes balances memory usage vs. reload time
- **Memory limit**: 12GB is reasonable for most systems
- **Concurrency**: 4 is conservative to avoid OOM errors
- **Batch size**: 512 is standard for Mistral

## How It Works

### Model Selection Priority

1. **Try Mistral 7B** (primary) - Best code quality
2. **Fall back to Qwen 7B Coder** - Good alternative
3. **Use ModelManager selection** - Last resort

### Timeout Handling

```
Cold Start (first request):
  1. Ollama starts (if not running)
  2. Model loads into memory (30-60 seconds)
  3. First request processed (OLLAMA_STARTUP_TIMEOUT = 180s)

Warm Start (subsequent requests):
  1. Model already in memory
  2. Request processed quickly (OLLAMA_WARMUP_TIMEOUT = 60s)
  3. Model stays in memory for 5 minutes (OLLAMA_KEEP_ALIVE)

After Keep-Alive Expires:
  1. Model unloaded from memory
  2. Next request triggers cold start again
```

### Auto-Start

Free Agent MCP automatically starts Ollama if it's not running:

```
1. Check if Ollama is responding (5 second timeout)
2. If not responding, spawn Ollama process
3. Wait for Ollama to be ready (OLLAMA_STARTUP_TIMEOUT)
4. Proceed with model loading and generation
```

## Testing the Configuration

### 1. Check Ollama Status

```bash
ollama list
```

Expected output:
```
NAME                    ID              SIZE    MODIFIED
mistral:7b              ...             4.1 GB  2 minutes ago
qwen2.5-coder:7b        ...             4.7 GB  1 week ago
qwen2.5:3b              ...             1.9 GB  1 week ago
nomic-embed-text        ...             274 MB  1 week ago
```

### 2. Test Cold Start

```bash
# Stop Ollama
ollama stop

# Wait 10 seconds
sleep 10

# Run Free Agent (will auto-start Ollama)
# Measure time to first response
```

Expected: 30-60 seconds for Ollama to start + model to load

### 3. Test Warm Start

```bash
# Run Free Agent again immediately
# Measure time to response
```

Expected: 5-15 seconds (model already loaded)

### 4. Test Keep-Alive

```bash
# Run Free Agent
# Wait 5 minutes
# Run Free Agent again
# Measure time to response
```

Expected: 5-15 seconds (model still in memory)

## Troubleshooting

### Issue: "Model not found" error

**Solution**: Pull the model
```bash
ollama pull mistral:7b
```

### Issue: Timeout errors

**Solution**: Increase timeout in `.env.local`
```bash
OLLAMA_REQUEST_TIMEOUT="600"  # 10 minutes instead of 5
```

### Issue: Out of memory errors

**Solution**: Reduce memory limit or close other apps
```bash
OLLAMA_MEMORY_LIMIT="8gb"  # Reduce from 12GB
```

### Issue: Slow generation

**Solution**: Enable GPU if available
```bash
OLLAMA_NUM_GPU="1"  # Use GPU
```

Or reduce batch size:
```bash
OLLAMA_BATCH_SIZE="256"  # Reduce from 512
```

## Next Steps

1. **Reload MCP config** in Augment to pick up new `.env.local` settings
2. **Test Free Agent** with the same 3 test tasks from previous analysis
3. **Compare results** with previous runs (validation scores: 6/100, 12/100, 12/100)
4. **Measure improvements** in code quality, compilation, type safety

## Expected Improvements

- ✅ Better code quality (Mistral 7B > Qwen 3B)
- ✅ Fewer hallucinated APIs
- ✅ Better type safety
- ✅ More complete implementations
- ✅ Faster generation (7B is reasonable size)
- ✅ More reliable (proven model)

## References

- Mistral 7B: https://mistral.ai/
- Ollama: https://ollama.ai/
- Model comparison: See `.augment/FREE_AGENT_ANALYSIS.md`

