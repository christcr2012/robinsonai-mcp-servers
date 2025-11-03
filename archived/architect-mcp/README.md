# Architect Agent MCP

**Strategic planning, critique, and insights using FREE local LLMs**

Part of [Robinson AI Systems](https://www.robinsonaisystems.com) MCP Server Suite

## Overview

Architect Agent MCP is a **design-only** MCP server that provides strategic planning and architectural insights using local reasoning models via Ollama. It **never writes to disk** - only returns JSON/text proposals that can be exported to Credit Optimizer for execution.

### Key Features

- 🧠 **Strategic Planning** - Turn intent into executable WorkPlans
- 🔍 **Architecture Review** - Analyze codebases and suggest improvements
- 📋 **ADR Generation** - Document architectural decisions
- ⚠️ **Risk Assessment** - Identify and catalog technical risks
- 🔒 **Security Review** - Vulnerability analysis
- ⚡ **Performance Review** - Bottleneck detection
- 🧪 **Code Smell Detection** - Anti-pattern identification
- 📝 **Patch Proposals** - Generate unified diffs (design-only)
- 💾 **SQLite Cache** - Persistent insights database
- 🆓 **100% FREE** - Uses local Ollama models (no API costs!)

## 12 Tools

### Discovery & Context
1. **index_repo** - Scan repository and build mental map
2. **get_repo_map** - Retrieve cached repository map

### Planning
3. **plan_work** - Create WorkPlan from intent
4. **export_workplan_to_optimizer** - Export to Credit Optimizer

### Reviews & Insights
5. **revise_plan** - Critique and improve existing plan
6. **architecture_review** - Analyze architecture
7. **generate_adr** - Create Architecture Decision Record
8. **risk_register** - Identify and catalog risks
9. **smell_scan** - Detect code smells
10. **security_review** - Security vulnerability analysis
11. **performance_review** - Performance bottleneck analysis
12. **propose_patches** - Generate patch diffs (design-only)

## Installation

```bash
# Install dependencies
npm install --workspace=packages/architect-mcp --legacy-peer-deps

# Build
cd packages/architect-mcp
npm run build
```

## Prerequisites

**Ollama must be running with a reasoning model:**

```bash
# Install Ollama
# https://ollama.ai

# Download recommended model
ollama pull deepseek-coder:33b

# Or use the reasoning model
ollama pull deepseek-r1:32b

# Start Ollama (runs on http://localhost:11434)
ollama serve
```

## Configuration

Add to your MCP settings (e.g., Augment Code VS Code extension):

```json
{
  "mcpServers": {
    "architect-agent": {
      "command": "node",
      "args": ["./packages/architect-mcp/dist/index.js"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "ARCHITECT_MODEL": "deepseek-coder:33b"
      }
    }
  }
}
```

### Environment Variables

- `OLLAMA_BASE_URL` - Ollama server URL (default: `http://localhost:11434`)
- `ARCHITECT_MODEL` - Model to use (default: `deepseek-coder:33b`)

## Usage Examples

### 1. Index Repository

```typescript
// Scan codebase and build mental map
{
  "tool": "index_repo",
  "arguments": {
    "path": "/path/to/repo"
  }
}
```

Returns:
- Framework detection (Next.js, React, etc.)
- Pattern detection (state management, styling, testing, etc.)
- Structure analysis (components, API routes, hooks, etc.)
- Conventions (naming patterns)

### 2. Create WorkPlan

```typescript
// Turn intent into executable plan
{
  "tool": "plan_work",
  "arguments": {
    "intent": "Add user authentication with email/password and OAuth",
    "constraints": {
      "maxFilesChanged": 20,
      "requireGreenTests": true
    }
  }
}
```

Returns:
- Detailed step-by-step plan
- Tool calls for each step
- Dependencies between steps
- Rollback strategies
- Success signals

### 3. Architecture Review

```typescript
// Analyze architecture and get recommendations
{
  "tool": "architecture_review",
  "arguments": {
    "repoMap": { /* from index_repo */ }
  }
}
```

Returns:
- Strengths and weaknesses
- Recommendations (high/medium/low priority)
- Effort estimates
- Specific improvements

### 4. Generate ADR

```typescript
// Document architectural decision
{
  "tool": "generate_adr",
  "arguments": {
    "title": "Use Zustand for state management",
    "context": "Need lightweight state management for React app",
    "decision": "Adopt Zustand instead of Redux",
    "alternatives": ["Redux", "Jotai", "Context API"]
  }
}
```

### 5. Risk Assessment

```typescript
// Identify technical risks
{
  "tool": "risk_register",
  "arguments": {
    "repoMap": { /* from index_repo */ },
    "plan": { /* from plan_work */ }
  }
}
```

Returns:
- Risk type (security, performance, scalability, etc.)
- Severity (low/medium/high/critical)
- Impact and likelihood
- Mitigation strategies

### 6. Code Smell Scan

```typescript
// Detect anti-patterns
{
  "tool": "smell_scan",
  "arguments": {
    "files": [
      {
        "path": "src/components/UserProfile.tsx",
        "content": "..."
      }
    ]
  }
}
```

Returns:
- Dead code
- Cyclic dependencies
- God objects
- Duplicate code
- Long functions
- Deep nesting
- Magic numbers
- Test brittleness

### 7. Propose Patches

```typescript
// Generate patch diffs (design-only)
{
  "tool": "propose_patches",
  "arguments": {
    "changes": [
      {
        "filePath": "src/auth/login.ts",
        "currentContent": "...",
        "proposedChanges": "Add rate limiting to login endpoint"
      }
    ]
  }
}
```

Returns:
- Unified diff format
- Reason for change
- Side effects
- Dependencies
- Testing notes

## Workflow: Plan → Patch → Prove → Ship

**Architect MCP is designed to work with Credit Optimizer MCP:**

1. **PLAN** (Architect): Create WorkPlan with `plan_work`
2. **CRITIQUE** (Architect): Improve with `revise_plan`
3. **REVIEW** (Architect): Check risks with `risk_register`, `security_review`
4. **EXPORT** (Architect): Export to Credit Optimizer with `export_workplan_to_optimizer`
5. **EXECUTE** (Credit Optimizer): Apply patches and run tests
6. **SHIP** (Robinson's Toolkit): Deploy via GitHub, Vercel, Neon

## Design Principles

### 1. Design-Only (Never Writes to Disk)

Architect MCP **only returns proposals** - it never modifies files. This ensures:
- Safe exploration of ideas
- Review before execution
- Separation of planning and execution
- Rollback-friendly workflows

### 2. Reasoning Models

Uses local reasoning models (deepseek-coder:33b, deepseek-r1:32b) for:
- Strategic thinking
- Architecture analysis
- Risk assessment
- Code review

### 3. SQLite Cache

Persistent database stores:
- Repository maps
- Symbol graphs
- Risk registers
- ADRs
- Plan history

Located at: `~/.architect-mcp/insights.db`

## Model Recommendations

| Task | Model | Size | Speed |
|------|-------|------|-------|
| Planning | deepseek-coder:33b | 18 GB | 45s |
| Review | deepseek-coder:33b | 18 GB | 45s |
| Analysis | qwen2.5-coder:32b | 19 GB | 15s |
| Reasoning | deepseek-r1:32b | 19 GB | 60s |

## Cost Savings

**100% FREE** - No API costs!

- OpenAI GPT-4: ~$0.03 per request × 100 requests/day = **$90/month**
- Anthropic Claude: ~$0.015 per request × 100 requests/day = **$45/month**
- **Architect MCP (Ollama): $0/month** ✅

## License

Copyright © 2025 Robinson AI Systems - https://www.robinsonaisystems.com

## Support

- Website: https://www.robinsonaisystems.com
- Issues: GitHub Issues
- Docs: See main README.md

## Related Servers

- **Autonomous Agent MCP** - Code generation via Ollama
- **Credit Optimizer MCP** - Workflows, templates, patches
- **Robinson's Toolkit MCP** - 912+ integration tools

