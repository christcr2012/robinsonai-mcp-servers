# Claude API Integration Guide

**Date**: 2025-10-30  
**Status**: ✅ FULLY IMPLEMENTED

---

## 🎯 **Overview**

The 6-server system now has **FULL Claude (Anthropic) support** across all agents!

### **Supported Providers**

| Provider | Models | Cost | When to Use |
|----------|--------|------|-------------|
| **Ollama** | qwen, deepseek, codellama | $0.00 | Default for simple tasks |
| **OpenAI** | gpt-4o-mini, gpt-4o, o1-mini | $0.15-$15/1M | Complex tasks, good reasoning |
| **Claude** | haiku, sonnet, opus | $0.25-$75/1M | Expert reasoning, complex analysis |

---

## 📋 **How the System Decides Which Provider to Use**

### **1. Model Selection Logic** (`selectBestModel()`)

Located in: `packages/paid-agent-mcp/src/model-catalog.ts`

**Decision Flow**:

```typescript
1. Check maxCost:
   - If maxCost === 0 → MUST use FREE Ollama
   
2. Check preferredProvider:
   - If 'ollama' → Use Ollama
   - If 'claude' → Use Claude
   - If 'openai' → Use OpenAI
   - If 'any' → Continue to next step
   
3. Check preferFree:
   - If preferFree === true → Use FREE Ollama
   - If preferFree === false → Use PAID models (OpenAI or Claude)
   
4. Select PAID model based on taskComplexity and maxCost:
   - Expert + high budget → Claude Sonnet (best reasoning)
   - Expert + medium budget → OpenAI o1-mini
   - Complex + high budget → Claude Sonnet
   - Complex + medium budget → OpenAI gpt-4o
   - Medium tasks → OpenAI gpt-4o-mini
   - Simple tasks → Claude Haiku (cheapest paid)
```

### **2. Agent Preferences**

| Agent | Default preferFree | Default Provider | Can Override? |
|-------|-------------------|------------------|---------------|
| **free-agent-mcp** | `true` | Ollama | ✅ YES |
| **paid-agent-mcp** | `false` | OpenAI/Claude | ✅ YES |

---

## 🔧 **When Claude is Automatically Selected**

### **Scenario 1: Expert-Level Tasks with High Budget**

```typescript
// User request
{
  taskComplexity: 'expert',
  maxCost: 10.0,
  preferFree: false
}

// System selects: claude/claude-3-5-sonnet-20241022
// Reason: Best reasoning model for expert tasks
```

### **Scenario 2: Complex Tasks with High Budget**

```typescript
// User request
{
  taskComplexity: 'complex',
  maxCost: 2.0,
  preferFree: false
}

// System selects: claude/claude-3-5-sonnet-20241022
// Reason: Excellent for complex reasoning
```

### **Scenario 3: Simple Tasks with Low Budget**

```typescript
// User request
{
  taskComplexity: 'simple',
  maxCost: 0.5,
  preferFree: false
}

// System selects: claude/claude-3-haiku-20240307
// Reason: Cheapest paid option ($0.25/1M input tokens)
```

### **Scenario 4: Explicit Claude Request**

```typescript
// User request
{
  preferredProvider: 'claude',
  taskComplexity: 'medium'
}

// System selects: claude/claude-3-5-sonnet-20241022
// Reason: User explicitly requested Claude
```

---

## 📊 **Claude Model Catalog**

### **Available Claude Models**

| Model ID | Model Name | Input Cost | Output Cost | Quality | Use Case |
|----------|-----------|------------|-------------|---------|----------|
| `claude/claude-3-haiku-20240307` | Claude 3 Haiku | $0.25/1M | $1.25/1M | Standard | Simple tasks, fast responses |
| `claude/claude-3-5-sonnet-20241022` | Claude 3.5 Sonnet | $3.00/1M | $15.00/1M | Best | Complex reasoning, expert tasks |
| `claude/claude-3-opus-20240229` | Claude 3 Opus | $15.00/1M | $75.00/1M | Premium | Highest quality, critical tasks |

---

## 🚀 **How to Use Claude**

### **Method 1: Let the System Decide (Recommended)**

```typescript
// Call paid-agent-mcp with high complexity
execute_versatile_task_paid-agent-mcp({
  task: "Analyze this complex codebase architecture",
  taskType: "code_analysis",
  taskComplexity: "expert",  // ← System will select Claude Sonnet
  maxCost: 10.0
})
```

### **Method 2: Explicitly Request Claude**

```typescript
// Force Claude provider
execute_versatile_task_paid-agent-mcp({
  task: "Generate comprehensive documentation",
  taskType: "documentation",
  params: {
    preferredProvider: "claude"  // ← Explicitly use Claude
  }
})
```

### **Method 3: Use Specific Claude Model**

```typescript
// Directly specify model (advanced)
execute_versatile_task_paid-agent-mcp({
  task: "Critical security analysis",
  taskType: "code_analysis",
  minQuality: "best",  // ← Will select Claude Sonnet or Opus
  maxCost: 20.0
})
```

---

## 🔍 **Implementation Details**

### **1. Claude Execution Logic**

Located in: `packages/paid-agent-mcp/src/index.ts`

```typescript
if (modelConfig.provider === 'claude') {
  // Use PAID Claude (Anthropic)
  const response = await anthropic.messages.create({
    model: modelConfig.model,
    max_tokens: params.maxTokens || modelConfig.maxTokens || 4096,
    temperature: params.temperature || 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: task }],
  });
  
  // Calculate cost and record spend
  const actualCost = estimateTaskCost({
    modelId,
    estimatedInputTokens: usage.input_tokens,
    estimatedOutputTokens: usage.output_tokens,
  });
  
  recordSpend(actualCost, `versatile_task_${modelConfig.model}`);
}
```

### **2. Cost Tracking**

- ✅ Input tokens tracked
- ✅ Output tokens tracked
- ✅ Actual cost calculated
- ✅ Spend recorded to database
- ✅ Monthly budget enforced

### **3. Budget Enforcement**

```typescript
// Check monthly budget before execution
const monthlySpend = getMonthlySpend();
if (!withinBudget(monthlySpend, estimatedCost)) {
  return {
    error: 'BUDGET_EXCEEDED',
    message: `Monthly budget of $${COST_POLICY.MONTHLY_BUDGET} would be exceeded`,
    suggestion: 'Use FREE Ollama (set maxCost=0) or wait until next month',
  };
}
```

---

## 📈 **Cost Comparison**

### **Example Task: Generate 1000 lines of code**

| Provider | Model | Input Tokens | Output Tokens | Cost |
|----------|-------|--------------|---------------|------|
| Ollama | deepseek-coder:33b | 2,000 | 4,000 | **$0.00** |
| OpenAI | gpt-4o-mini | 2,000 | 4,000 | **$0.0006** |
| OpenAI | gpt-4o | 2,000 | 4,000 | **$0.065** |
| Claude | haiku | 2,000 | 4,000 | **$0.0055** |
| Claude | sonnet | 2,000 | 4,000 | **$0.066** |
| Claude | opus | 2,000 | 4,000 | **$0.33** |

**Recommendation**: Use Ollama for simple tasks, Claude Haiku for affordable paid, Claude Sonnet for complex reasoning.

---

## 🎯 **Best Practices**

### **1. Start with FREE Ollama**

```typescript
// Default behavior - FREE!
execute_versatile_task_free-agent-mcp({
  task: "Generate simple CRUD endpoints",
  taskType: "code_generation"
})
// Uses: Ollama (FREE)
```

### **2. Escalate to Claude for Complex Tasks**

```typescript
// Complex reasoning needed
execute_versatile_task_paid-agent-mcp({
  task: "Refactor this legacy codebase with complex dependencies",
  taskType: "refactoring",
  taskComplexity: "expert",
  maxCost: 5.0
})
// Uses: Claude Sonnet (best reasoning)
```

### **3. Use Budget Limits**

```typescript
// Prevent overspending
execute_versatile_task_paid-agent-mcp({
  task: "Analyze security vulnerabilities",
  taskType: "code_analysis",
  maxCost: 1.0  // ← Will select cheaper model if needed
})
// Uses: OpenAI gpt-4o-mini or Claude Haiku
```

---

## ✅ **Verification**

### **Check Claude is Working**

```bash
# 1. Verify API key is set
echo $ANTHROPIC_API_KEY

# 2. Test Claude execution
npx paid-agent-mcp
# Then call: execute_versatile_task_paid-agent-mcp with preferredProvider: "claude"

# 3. Check logs
# Should see: "Selected model: claude/claude-3-5-sonnet-20241022 (claude)"
```

---

## 🚨 **Troubleshooting**

### **Problem: Claude not being selected**

**Solution**: Check these parameters:
- `preferFree` should be `false`
- `maxCost` should be > $0.25
- `taskComplexity` should be 'complex' or 'expert'
- OR set `preferredProvider: 'claude'`

### **Problem: "ANTHROPIC_API_KEY not set"**

**Solution**: Add to your MCP config:
```json
{
  "paid-agent-mcp": {
    "env": {
      "ANTHROPIC_API_KEY": "sk-ant-api03-..."
    }
  }
}
```

---

## 📚 **Summary**

✅ **Claude is FULLY integrated** into the 6-server system  
✅ **Automatic selection** based on task complexity and budget  
✅ **Manual override** via `preferredProvider: 'claude'`  
✅ **Cost tracking** and budget enforcement  
✅ **3 Claude models** available (Haiku, Sonnet, Opus)  

**The system is smart enough to choose the right provider for each task!** 🚀

