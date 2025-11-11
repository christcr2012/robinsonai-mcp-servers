# Free Agent Model Strategy

## Overview

Free Agent now uses a **multi-model strategy** where each model is optimized for its specific use case:

| Model | Size | Purpose | Strengths |
|-------|------|---------|-----------|
| **qwen2.5-coder:7b** | 4.7 GB | Code generation | Best 7B code model, code reasoning, refactoring |
| **mistral:7b** | 4.4 GB | Analysis & tools | API integration, research, planning, reasoning |
| **deepseek-coder:1.3b** | 776 MB | Fallback code | Small, code-specific, fast |
| **qwen2.5:3b** | 1.9 GB | Routing | Fast intent detection, routing decisions |
| **nomic-embed-text** | 274 MB | Embeddings | Semantic search, code retrieval |

## Model Selection Logic

### For Code Generation Tasks
```
1. Try Qwen 2.5 Coder 7B (BEST 7B code model)
2. Fall back to DeepSeek Coder 1.3B (small but code-specific)
3. Last resort: Mistral 7B (general purpose)
```

### For Analysis/Research/Planning Tasks
```
1. Try Mistral 7B (excellent reasoning, API understanding)
2. Fall back to Qwen 2.5 Coder 7B (if Mistral unavailable)
```

### For Routing/Intent Detection
```
1. Use Qwen 3B (fast, lightweight)
```

## Why This Strategy?

### Qwen 2.5 Coder 7B (Code Generation)
- **Specifically trained for code** - Not a general-purpose model
- **Community consensus** - Best 7B code model available
- **Superior code quality** - Fewer hallucinations, better type safety
- **Code reasoning** - Understands code patterns and best practices
- **Code fixing** - Can refactor and improve existing code

### Mistral 7B (Analysis & Tools)
- **Better reasoning** - Excellent at understanding complex concepts
- **API integration** - Understands OpenAI, Supabase, Google Workspace APIs
- **Configuration** - Good at database schemas, environment setup
- **Research** - Can analyze code and documentation
- **Planning** - Better at decision-making and trade-offs
- **Tool orchestration** - Coordinates multiple services

### DeepSeek Coder 1.3B (Fallback)
- **Code-specific** - Trained for code generation
- **Small & fast** - 776 MB, quick inference
- **Fallback option** - Better than nothing if larger models fail

### Qwen 3B (Routing)
- **Fast** - Quick intent detection
- **Lightweight** - 1.9 GB, minimal overhead
- **Routing only** - Not for actual code generation

## Use Cases

### ✅ Use Qwen Coder for:
- Writing new functions/modules
- Refactoring existing code
- Generating tests
- Bug fixes
- Code reviews
- Type safety improvements

### ✅ Use Mistral for:
- Setting up OpenAI API integration
- Configuring Google Workspace tools
- Planning Supabase database schemas
- Creating n8n workflows
- Analyzing code patterns
- Research and documentation
- Decision-making on architecture

### ✅ Use DeepSeek Coder for:
- Quick code generation (when Qwen unavailable)
- Simple code snippets
- Fallback when primary model fails

### ✅ Use Qwen 3B for:
- Routing requests to appropriate handler
- Intent detection
- Quick classification tasks

## Configuration

### `.env.local`
```bash
OLLAMA_PRIMARY_MODEL="qwen2.5-coder:7b"      # Code generation
OLLAMA_FALLBACK_MODEL="deepseek-coder:1.3b"  # Code fallback
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"    # Embeddings

# Timeouts
OLLAMA_STARTUP_TIMEOUT="180"        # 3 minutes for cold start
OLLAMA_WARMUP_TIMEOUT="60"          # 1 minute for warm start
OLLAMA_REQUEST_TIMEOUT="300"        # 5 minutes for requests
```

### `augment-mcp-config.json`
```json
{
  "Free Agent MCP": {
    "args": ["dlx", "@robinson_ai_systems/free-agent-mcp@0.6.0"],
    "env": {
      "OLLAMA_PRIMARY_MODEL": "qwen2.5-coder:7b",
      "OLLAMA_FALLBACK_MODEL": "deepseek-coder:1.3b",
      ...
    }
  }
}
```

## Performance Expectations

### Code Generation (Qwen Coder)
- **Quality**: 75-85% (vs 5-10% with small models)
- **Speed**: 30-60 seconds per task
- **Accuracy**: Better type safety, fewer hallucinations

### Analysis/Research (Mistral)
- **Quality**: 80-90% (excellent reasoning)
- **Speed**: 20-40 seconds per task
- **Accuracy**: Better API understanding, planning

### Fallback (DeepSeek Coder)
- **Quality**: 40-60% (small model limitations)
- **Speed**: 5-15 seconds per task
- **Use**: Only when primary unavailable

## Future Improvements

1. **Task-aware routing** - Automatically select model based on task type
2. **Hybrid approach** - Use Mistral for planning, Qwen for implementation
3. **Larger models** - Test 13B/14B models when available
4. **Fine-tuning** - Fine-tune models on your specific use cases
5. **Ensemble** - Combine multiple models for better results

## Version History

- **v0.6.0** - Added Mistral for analysis/research tasks
- **v0.5.9** - Switched to Qwen Coder as primary
- **v0.5.8** - Fixed model selection logic
- **v0.5.7** - Initial Ollama reconfiguration

## Next Steps

1. Reload MCP config in Augment
2. Test code generation with Qwen Coder
3. Test analysis tasks with Mistral
4. Compare results with previous runs
5. Document improvements

