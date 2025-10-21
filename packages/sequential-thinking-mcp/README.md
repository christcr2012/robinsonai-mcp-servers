# @robinsonai/sequential-thinking-mcp

**Enhanced Sequential Thinking MCP Server**

Advanced reasoning capabilities for AI assistants with 3 powerful thinking modes.

## 🧠 Features

### 3 Thinking Tools

1. **sequential_thinking** - Break down complex problems into sequential thought steps
   - Dynamic thought adjustment
   - Revision support
   - Branching capabilities
   - Thought history tracking

2. **parallel_thinking** (NEW) - Explore multiple solution paths simultaneously
   - Create multiple branches
   - Evaluate different approaches in parallel
   - Compare conclusions across branches
   - Track progress in each branch

3. **reflective_thinking** (NEW) - Review and critique previous thoughts
   - Reflect on past decisions
   - Identify improvements
   - Assess confidence levels
   - Track average confidence across reflections

## 🚀 Installation

```bash
cd packages/sequential-thinking-mcp
npm install
npm run build
npm link
```

## ⚙️ Configuration

### For Augment Code

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["sequential-thinking-mcp"]
    }
  }
}
```

## 📖 Usage Examples

### Sequential Thinking
```typescript
// Break down a complex problem
{
  "thought": "First, I need to understand the requirements",
  "thoughtNumber": 1,
  "totalThoughts": 5,
  "nextThoughtNeeded": true
}
```

### Parallel Thinking
```typescript
// Explore multiple approaches
{
  "branchId": "approach-a",
  "description": "Use recursive algorithm",
  "thought": "This approach would be more elegant",
  "thoughtNumber": 1,
  "nextThoughtNeeded": true
}
```

### Reflective Thinking
```typescript
// Reflect on a previous thought
{
  "thoughtNumber": 3,
  "reflection": "This assumption might be incorrect",
  "improvements": [
    "Consider edge cases",
    "Add validation"
  ],
  "confidence": 0.7
}
```

## 🎯 Benefits

- **Better Problem Solving**: Break down complex problems systematically
- **Multiple Perspectives**: Explore different solution paths in parallel
- **Self-Improvement**: Reflect on and improve your reasoning
- **Confidence Tracking**: Monitor confidence levels across decisions
- **Thought History**: Full audit trail of reasoning process

## 📝 License

MIT - Robinson AI Systems

