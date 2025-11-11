# Kimi Integration & Intelligent Model Switching

## Overview

Free Agent now has two major enhancements:

1. **Kimi/Moonshot API Integration** - Cheapest paid model option
2. **Intelligent Mid-Task Model Switching** - Automatically switch models based on detected subtasks

## Part 1: Kimi Integration

### What is Kimi?

Kimi (Moonshot AI) is a Chinese LLM provider with **extremely competitive pricing**:
- **$0.20 per 1M input tokens** (vs $2.50 for GPT-4o)
- **$2.00 per 1M output tokens** (vs $10.00 for GPT-4o)
- **10x cheaper than OpenAI** for code generation
- **Best bang for buck** among paid models

### Kimi Models Available

| Model | Context | Input | Output | Best For |
|-------|---------|-------|--------|----------|
| moonshot-v1-8k | 8K | $0.20/1M | $2.00/1M | Quick tasks |
| moonshot-v1-32k | 32K | $0.20/1M | $2.00/1M | Larger tasks |

### Setup

1. **Get API Key**: Sign up at https://platform.moonshot.ai
2. **Set Environment Variable**:
   ```bash
   export KIMI_API_KEY="sk-..."
   ```
3. **Optional - Custom Base URL**:
   ```bash
   export KIMI_BASE_URL="https://api.moonshot.cn/v1"
   ```

### Model Selection Strategy

Free Agent automatically prefers Kimi for cheap tasks:

```
Task Complexity → Model Selection
- Simple tasks → Kimi (cheapest!)
- Medium tasks → Kimi (if available) or OpenAI
- Complex tasks → Claude/OpenAI (better quality)
- Expert tasks → Claude Opus (best quality)
```

### Cost Comparison

For a typical code generation task (1000 input tokens, 2000 output tokens):

| Model | Cost |
|-------|------|
| **Kimi** | **$0.0044** ✅ |
| GPT-4o-mini | $0.0015 + $0.0012 = $0.0027 |
| Claude Haiku | $0.00025 + $0.00125 = $0.0015 |
| Qwen Coder (FREE) | $0.00 |

**Kimi is 10x cheaper than GPT-4o!**

## Part 2: Intelligent Model Switching

### What is Model Switching?

Automatically switch between models during task execution based on detected subtasks.

### Example Workflow

```
Task: "Implement user authentication with Google OAuth"

1. START: Qwen Coder (code generation)
   - Detect: "needs API setup" → SWITCH

2. MISTRAL: API Integration
   - Set up Google OAuth configuration
   - Create environment variables
   - Document API setup
   - Detect: "ready for code" → SWITCH

3. QWEN CODER: Code Generation
   - Implement authentication logic
   - Write tests
   - COMPLETE
```

### Detected Subtask Types

| Subtask | Suggested Model | Reason |
|---------|-----------------|--------|
| code_generation | Qwen Coder | Best 7B code model |
| code_refactoring | Qwen Coder | Excellent at refactoring |
| test_generation | Qwen Coder | Best for tests |
| api_integration | Mistral | Better API reasoning |
| database_setup | Mistral | Excellent at schemas |
| configuration | Mistral | Good at config files |
| research | Mistral | Better analysis |
| analysis | Mistral | Superior reasoning |
| planning | Mistral | Better decision-making |
| documentation | Mistral | Better explanations |

### Detection Keywords

**API Integration**: api, openai, supabase, google, n8n, webhook, oauth, authentication

**Database Setup**: database, schema, migration, postgres, neon, table, index

**Research/Analysis**: research, analyze, investigate, understand, compare, evaluate

**Test Generation**: test, jest, vitest, mocha, unit test, integration test

**Code Generation**: function, class, component, refactor, implement, write code

### How It Works

1. **Detect**: Analyze task description for keywords
2. **Score**: Calculate confidence (0-1) for each subtask type
3. **Suggest**: Recommend model switch if confidence > 0.75
4. **Switch**: Change model if beneficial
5. **Track**: Log all switches for transparency

### Benefits

✅ **Optimal Model for Each Task** - Use specialized models for their strengths
✅ **Cost-Effective** - Use cheap models where they excel
✅ **Better Quality** - Use best models for complex tasks
✅ **Transparent** - Full logging of model switches
✅ **Automatic** - No manual intervention needed

## Configuration

### Model Preferences

In `.env.local`:
```bash
# Primary model for code (Qwen Coder)
OLLAMA_PRIMARY_MODEL="qwen2.5-coder:7b"

# Fallback for code (DeepSeek)
OLLAMA_FALLBACK_MODEL="deepseek-coder:1.3b"

# Kimi API key (enables cheap paid option)
KIMI_API_KEY="sk-..."

# Optional: Custom Kimi base URL
KIMI_BASE_URL="https://api.moonshot.cn/v1"
```

### Model Catalog

All models are defined in `packages/free-agent-mcp/src/model-catalog.ts`:
- FREE: Ollama models (Qwen, DeepSeek, Mistral)
- PAID: OpenAI, Claude, Kimi, Voyage

## Implementation Files

### New Files
- `packages/free-agent-mcp/src/agents/task-router.ts` - Task detection and switching logic
- `packages/free-agent-mcp/src/model-catalog.ts` - Updated with Kimi models
- `packages/free-agent-mcp/src/shared/shared-llm/llm-client.ts` - Kimi API client

### Updated Files
- `augment-mcp-config.json` - Updated to v0.6.0
- `.env.local` - Added Kimi configuration

## Testing

### Test Kimi Integration
```bash
# Set Kimi API key
export KIMI_API_KEY="sk-..."

# Run Free Agent with Kimi
# It will automatically use Kimi for cheap tasks
```

### Test Model Switching
```bash
# Run a task that requires API setup
# Watch logs for model switches
# Should see: Qwen → Mistral → Qwen
```

## Future Improvements

1. **Hybrid Execution** - Use Mistral for planning, Qwen for implementation
2. **Cost Optimization** - Automatically choose cheapest model for each subtask
3. **Quality Scoring** - Track quality of each model for each task type
4. **Learning** - Improve detection based on past results
5. **Larger Models** - Support 13B/14B models when available

## Version History

- **v0.6.0** - Added Kimi integration and intelligent model switching
- **v0.5.9** - Switched to Qwen Coder as primary
- **v0.5.8** - Fixed model selection logic
- **v0.5.7** - Initial Ollama reconfiguration

