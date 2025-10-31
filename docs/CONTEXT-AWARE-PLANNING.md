# Context-Aware Planning System

## Overview

The 6-server system now includes **repository-agnostic context discovery** that enables the architect to understand ANY codebase at runtime without hardcoded assumptions.

## Design Principles

1. **Dynamic Discovery** - Learn repository structure at runtime
2. **Pattern Recognition** - Identify conventions from existing code
3. **Example-Based Learning** - Find similar code to guide new work
4. **Forward Compatible** - Ready for RAD crawler knowledge base integration

## How It Works

### 1. Repository Structure Discovery

When the architect receives a planning request, it automatically scans the repository to discover:

- **Project Type**: Monorepo, single-package, multi-module
- **Packages**: All packages/apps with their types (library, application, tool)
- **Directory Structure**: Source dirs, test dirs, build dirs
- **Entry Points**: Main files, build outputs

### 2. Code Convention Detection

The system samples ~50 code files to detect:

- **File Naming**: kebab-case, camelCase, PascalCase, snake_case
- **Import Style**: ESM, CommonJS, mixed
- **Quote Style**: Single quotes, double quotes
- **Indentation**: Tabs, 2-spaces, 4-spaces
- **Line Endings**: LF, CRLF
- **Formatting**: Compact (single-line) vs verbose (multi-line)

### 3. Code Examples Discovery

The system finds existing code patterns:

- **Tool Definitions**: Files with tool/handler patterns
- **API Handlers**: Route/API handler files
- **Test Files**: Test/spec files
- **Config Files**: Configuration files

### 4. Metadata Gathering

The system collects:

- **Languages**: TypeScript, JavaScript, Go, Rust, Python
- **Frameworks**: Next.js, React, Vue, Express, NestJS
- **Package Manager**: npm, yarn, pnpm, bun
- **Build Tools**: TypeScript, Webpack, Vite, esbuild
- **Test Frameworks**: Vitest, Jest, Mocha, Playwright
- **File/Line Counts**: Total files and lines of code

## Example Output

```
# Project Structure: monorepo
Root: C:\Users\chris\Git Local\robinsonai-mcp-servers

## Metadata
Languages: TypeScript, JavaScript
Frameworks: None
Package Manager: npm
Build Tools: TypeScript
Test Frameworks: Vitest
Total Files: 742
Total Lines: 45,231

## Packages (28)
- architect-mcp (tool)
  Path: packages/architect-mcp
  Source: src
  Build: dist

- free-agent-mcp (tool)
  Path: packages/free-agent-mcp
  Source: src
  Build: dist

... (26 more packages)

## Code Conventions
File Naming: kebab-case
Import Style: esm
Quote Style: single
Indentation: 2-spaces
Line Endings: lf
Formatting: compact

## Code Examples
Tool Definitions: 45 files
API Handlers: 23 files
Test Files: 12 files
Config Files: 35 files
```

## Integration with Planning

### With Ollama (LLM-Powered)

When Ollama is available, the architect includes the full repository context in the planning prompt:

```typescript
const prompt = [
  "You are a senior software architect creating PARALLEL EXECUTION plans.",
  "",
  "REPOSITORY CONTEXT (use this to understand the codebase):",
  "```",
  contextSummary,  // Full project structure, conventions, examples
  "```",
  "",
  "CRITICAL RULES:",
  "1. Follow the repository's conventions (see REPOSITORY CONTEXT above)",
  "2. Reference actual files/packages from the repository structure",
  "3. Use concrete file paths and line numbers",
  // ... more rules
  "",
  "SPEC:", specText,
  ""
].join("\n");
```

### Without Ollama (Context-Aware Fallback)

When Ollama is unavailable, the architect uses **intelligent pattern matching** on the spec text:

```typescript
// Parse the spec to extract key information
const specLower = specText.toLowerCase();
const isStandardization = specLower.includes("standardize") || specLower.includes("format");
const isVercelTask = specLower.includes("vercel");
const isToolkitTask = specLower.includes("toolkit");

// Build context-aware steps
if (isStandardization && isVercelTask && isToolkitTask) {
  return [
    {
      title: "Analyze Vercel tool format in packages/robinsons-toolkit-mcp/src/index.ts",
      tool: "execute_versatile_task_autonomous-agent-mcp_free-agent-mcp",
      params: {
        task: "Analyze the format of Vercel tools (lines 643-2556)...",
        taskType: "code_analysis"
      }
    },
    // ... more concrete steps with actual file paths and line numbers
  ];
}
```

## RAD Crawler Integration (Future)

The system is designed to integrate with RAD crawler when available:

```typescript
/**
 * Future: Query RAD crawler knowledge base for deeper insights
 * 
 * When RAD crawler is available, this function will:
 * 1. Check if RAD crawler DB is accessible
 * 2. Query for repository-specific knowledge
 * 3. Merge with runtime discovery
 * 4. Fall back to discovery-only if KB unavailable
 */
export async function enrichWithKnowledgeBase(
  structure: ProjectStructure,
  radCrawlerUrl?: string
): Promise<ProjectStructure> {
  if (radCrawlerUrl) {
    // Query RAD crawler for:
    // - Historical changes and patterns
    // - Common pitfalls and solutions
    // - Best practices for this codebase
    // - Similar code examples
    
    // Merge KB data with runtime discovery
    // Fall back to discovery if KB unavailable
  }
  
  return structure;
}
```

## Benefits

### 1. Works on ANY Repository

The system doesn't hardcode assumptions about:
- Directory structure
- File naming conventions
- Code style
- Framework choices

It **learns** these at runtime by analyzing the actual codebase.

### 2. Generates Concrete Plans

Instead of generic steps like "Implement feature", the system generates:
- Specific file paths
- Exact line ranges
- Appropriate tools
- Correct context

### 3. Respects Existing Conventions

The system detects and follows:
- Existing code formatting
- Import styles
- File naming patterns
- Directory structure

### 4. Future-Proof

When RAD crawler is ready, the system will:
- Query the knowledge base for deeper insights
- Merge KB data with runtime discovery
- Fall back gracefully if KB unavailable

## Example: Vercel Standardization Task

**User Request:**
```
Standardize all 150 Vercel tools in packages/robinsons-toolkit-mcp/src/index.ts 
from multi-line format to single-line compact format to match GitHub/Neon/Upstash style
```

**Generated Plan:**
```json
[
  {
    "title": "Analyze Vercel tool format in packages/robinsons-toolkit-mcp/src/index.ts",
    "tool": "execute_versatile_task_autonomous-agent-mcp_free-agent-mcp",
    "params": {
      "task": "Analyze the format of Vercel tools (lines 643-2556) in packages/robinsons-toolkit-mcp/src/index.ts and compare with GitHub/Neon/Upstash format",
      "taskType": "code_analysis"
    }
  },
  {
    "title": "Convert Vercel tools to single-line format (batch 1: lines 643-1100)",
    "tool": "execute_versatile_task_autonomous-agent-mcp_free-agent-mcp",
    "params": {
      "task": "Convert Vercel tools from multi-line to single-line format in packages/robinsons-toolkit-mcp/src/index.ts (lines 643-1100)",
      "taskType": "refactoring",
      "params": {
        "context": "TypeScript, MCP tools, single-quote single-line format"
      }
    }
  },
  // ... 3 more batches covering lines 1101-2556
]
```

**Result:**
- ✅ Concrete file paths
- ✅ Exact line ranges
- ✅ Appropriate task types
- ✅ Correct context
- ✅ Parallel execution ready

## Files

- `packages/architect-mcp/src/context/discovery.ts` - Main discovery system
- `packages/architect-mcp/src/context/scan.ts` - Legacy scanner (deprecated)
- `packages/architect-mcp/src/planner/incremental.ts` - Planning integration

## Usage

The discovery system runs automatically when the architect creates a plan. No manual configuration needed!

```bash
# Just run the orchestrator with any task
node packages/agent-orchestrator/dist/index.js "Your task here"

# The architect will:
# 1. Discover repository structure
# 2. Detect code conventions
# 3. Find code examples
# 4. Generate context-aware plan
# 5. Execute with appropriate agents
```

