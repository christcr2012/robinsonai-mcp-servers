# Ollama Reconfiguration Plan: Better Code Generation

## Current Models (Too Small)
- ❌ `deepseek-coder:1.3b` - 776 MB (too small, poor quality)
- ❌ `qwen2.5:3b` - 1.9 GB (too small, hallucinations)
- ⚠️ `qwen2.5-coder:7b` - 4.7 GB (marginal, inconsistent)
- ✅ `nomic-embed-text` - 274 MB (keep for embeddings)

## Recommended Replacement

### Primary Model: `mistral:7b`
- **Size**: 4.1 GB
- **Quality**: Excellent for code (trained on code)
- **Speed**: Fast (7B parameters)
- **Memory**: ~8-10 GB RAM needed
- **Suitable for**: Code generation, reasoning
- **Why**: Better than qwen2.5-coder:7b, proven track record

### Alternative: `neural-chat:7b`
- **Size**: 4.7 GB
- **Quality**: Good for code + chat
- **Speed**: Fast
- **Memory**: ~8-10 GB RAM needed
- **Why**: Balanced code + conversation

### Fallback: `codeqwen:7b`
- **Size**: 4.3 GB
- **Quality**: Specialized for code
- **Speed**: Fast
- **Memory**: ~8-10 GB RAM needed
- **Why**: Purpose-built for code generation

## Recommended Configuration

**Primary**: `mistral:7b` (best overall)
**Fallback**: `neural-chat:7b` (if mistral fails)
**Embeddings**: `nomic-embed-text` (keep)

## System Requirements

Your PC needs:
- **RAM**: 16 GB minimum (8 GB for model + 8 GB for OS/apps)
- **VRAM**: Optional (GPU acceleration helps but not required)
- **Disk**: 10-15 GB free for models

## Configuration Changes Needed

### 1. `.env.local` Updates
```bash
# Remove small models
# FAST_MODEL="qwen2.5:3b"
# MEDIUM_MODEL="qwen2.5-coder:7b"
# COMPLEX_MODEL="qwen2.5-coder:7b"

# Add new models
OLLAMA_PRIMARY_MODEL="mistral:7b"
OLLAMA_FALLBACK_MODEL="neural-chat:7b"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"

# Timeouts (for cold starts)
OLLAMA_STARTUP_TIMEOUT="180"        # 3 minutes for first load
OLLAMA_WARMUP_TIMEOUT="60"          # 1 minute for warm starts
OLLAMA_REQUEST_TIMEOUT="300"        # 5 minutes for requests

# Performance tuning
OLLAMA_NUM_GPU="1"                  # Use GPU if available
OLLAMA_NUM_THREAD="8"               # CPU threads
OLLAMA_KEEP_ALIVE="5m"              # Keep model in memory 5 min
```

### 2. Free Agent MCP Configuration
- Update model selection logic
- Add warmup/cold-start handling
- Implement timeout escalation
- Add retry logic with exponential backoff

### 3. Ollama Service Configuration
- Auto-start on system boot
- Keep-alive settings
- Memory management
- GPU acceleration (if available)

## Implementation Steps

### Step 1: Pull New Model
```bash
ollama pull mistral:7b
```
**Time**: 10-15 minutes (depends on internet)
**Size**: 4.1 GB

### Step 2: Test Model
```bash
ollama run mistral:7b "Write a TypeScript function that validates email addresses"
```

### Step 3: Update Configuration
- Update `.env.local` with new model names
- Update Free Agent MCP to use new models
- Update timeout settings

### Step 4: Test Cold Start
- Stop Ollama service
- Start Ollama service
- Measure time to first response
- Adjust timeouts if needed

### Step 5: Test Warm Start
- Keep Ollama running
- Make multiple requests
- Measure response times
- Verify keep-alive works

### Step 6: Auto-Start Configuration
- Configure Ollama to start on boot
- Set up service auto-restart
- Configure memory limits

## Expected Performance

### Cold Start (first request after restart)
- **Time**: 30-60 seconds
- **Timeout needed**: 180 seconds (3 minutes)

### Warm Start (model already loaded)
- **Time**: 5-15 seconds
- **Timeout needed**: 60 seconds (1 minute)

### Steady State (multiple requests)
- **Time**: 3-8 seconds per request
- **Timeout needed**: 30 seconds

## Success Criteria

✅ Model loads successfully  
✅ Cold start < 60 seconds  
✅ Warm start < 15 seconds  
✅ Code generation quality improved  
✅ No OOM (out of memory) errors  
✅ Auto-start works on reboot  

## Rollback Plan

If mistral:7b doesn't work:
1. Keep qwen2.5-coder:7b as fallback
2. Try neural-chat:7b
3. Try codeqwen:7b
4. Fall back to qwen2.5-coder:7b

All models will remain installed until confirmed working.

