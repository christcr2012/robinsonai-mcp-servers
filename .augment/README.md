# Free Agent Operating Recipe

Complete configuration for Augment to drive Free Agent MCP as a production-ready, repo-native code implementer.

## Overview

This directory contains the complete operating recipe for Free Agent MCP:

- **Rules**: Policies for context gathering, tool discovery, quality gates
- **Actions**: Orchestrated workflows for feature implementation
- **Prompts**: System prompts for repo-native code generation
- **Libraries**: Capability discovery, quality gates, refinement loops
- **Documentation**: Decision tables, best practices, examples

## Quick Start

### 1. Environment Setup

Add to your `.env` or shell environment:

```bash
# Free Agent Configuration
FREE_AGENT_QUALITY=balanced              # fast|balanced|best
FREE_AGENT_REJECT_PLACEHOLDERS=1         # Fail on TODOs/stubs
FREE_AGENT_ENFORCE_IMPORTS=1             # Verify all imports resolve
FREE_AGENT_MULTIFILE_DEFAULT=1           # Enable multi-file planning
FREE_AGENT_REFERENCE_EXISTING=1          # Search before creating
FREE_AGENT_TEST_COVERAGE_MIN=80          # Minimum test coverage %

# Thinking Tools Configuration
THINKING_TOOLS_SAFE_DOCS=1               # Fetch official docs before guessing
CTX_RANKING=blend                        # Blend local + external context

# Toolkit Configuration
TOOLKIT_DISCOVERY_STRICT=0               # Allow fuzzy fallback
BROKER_MODE=1                            # Use broker pattern for tools
```

### 2. Augment Configuration

Ensure your `augment-mcp-config.json` includes:

```json
{
  "mcpServers": {
    "Free Agent MCP": {
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/free-agent-mcp@0.7.3", "serve"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "FREE_AGENT_QUALITY": "balanced",
        "FREE_AGENT_REJECT_PLACEHOLDERS": "1"
      }
    },
    "Thinking Tools MCP": {
      "command": "pnpm.cmd",
      "args": ["dlx", "@robinson_ai_systems/thinking-tools-mcp@1.26.0"]
    },
    "Robinson's Toolkit MCP": {
      "command": "pnpm.cmd",
      "args": ["dlx", "@robinson_ai_systems/robinsons-toolkit-mcp@1.16.1"]
    }
  }
}
```

### 3. Usage in Augment

Use the `implement.feature.with.free.agent` action:

```typescript
// In Augment chat:
"Implement a notifications API with Free Agent"

// Augment will:
// 1. Apply policies (context, tools, quality gates)
// 2. Generate project brief
// 3. Discover relevant tools
// 4. Generate code with Free Agent
// 5. Verify quality (build, lint, tests)
// 6. Refine if needed (up to 3 attempts)
// 7. Return working code + tests + report
```

## File Structure

```
.augment/
├── README.md                           # This file
├── rules/
│   └── free-agent-operating-recipe.yaml  # Policies for Augment
├── actions/
│   └── implement-with-free-agent.yaml    # Orchestrated workflows
├── prompts/
│   └── free-agent-system.md              # System prompt template
├── lib/
│   ├── capability-discovery.ts           # Dynamic tool discovery
│   └── quality-gates.ts                  # Validation & refinement
└── docs/
    └── toolkit-vs-code-decision-table.md # When to use tools vs code
```

## Key Concepts

### 1. Capability Discovery

Free Agent discovers tools dynamically at runtime - no hardcoded tool names:

```typescript
// Discover tools for "deploy to vercel"
const tools = await discovery.pickTool("deploy", ["vercel", "deployment"]);

// Get current schema
const schema = await toolkit.getToolSchema({
  category: tools.category,
  tool_name: tools.name
});

// Generate args dynamically
const args = generateArgsFromSchema(schema, task.params);
```

### 2. Quality Gates

Code is validated through multiple gates based on quality mode:

- **Fast**: Build check + placeholder detection
- **Balanced**: Build + lint + types + imports + tests
- **Best**: All of above + coverage + security

### 3. Refinement Loop

If verification fails:

1. Analyze failures with Thinking Tools (`framework_root_cause`)
2. Generate fix plan
3. Apply fixes with `free_agent_refine_code`
4. Re-verify
5. Repeat up to 3 times

### 4. Context Injection

Before generating code, Free Agent receives:

- **Project Brief**: Repo conventions, architecture, patterns
- **Similar Code**: Semantically similar files from context engine
- **Tool Catalog**: Available integration tools
- **Official Docs**: API documentation from Context7
- **Design Analysis**: Premortem, devil's advocate critiques

## Policies

### Context Usage (`fa.use.context`)

Automatically applied when task involves code generation:

- Generate/retrieve project brief
- Query context engine for similar code
- Inject as context for Free Agent

### Tool Discovery (`fa.tool.discovery`)

Automatically applied when task needs integrations:

- List available toolkit categories
- Fuzzy search for relevant tools
- Inject tool catalog as context

### Quality Gates (`fa.quality.gates`)

Automatically applied for all code tasks:

- Set quality mode (fast/balanced/best)
- Require test report
- Require clean build
- Reject placeholders
- Enforce import resolution

### Design Validation (`fa.design.validation`)

Automatically applied for complex tasks:

- Run premortem analysis
- Run devil's advocate critique
- Inject analysis as context

## Actions

### `implement.feature.with.free.agent`

Full-featured implementation workflow:

**Inputs**:
- `title`: Feature title
- `description`: What to build
- `acceptance_criteria`: List of requirements
- `target_paths`: Files to modify (optional)
- `complexity`: simple|medium|complex|expert
- `quality_mode`: fast|balanced|best

**Outputs**:
- `files`: Generated/modified files
- `tests`: Test files
- `integrations`: Toolkit tools used
- `report`: Quality verification report

### `quick.fix.with.free.agent`

Quick bugfix workflow (no planning):

**Inputs**:
- `description`: What to fix
- `file_path`: File to modify

**Outputs**:
- `files`: Fixed files
- `verification`: Quality report

## Decision Table

See [docs/toolkit-vs-code-decision-table.md](docs/toolkit-vs-code-decision-table.md) for complete decision matrix.

**General Rule**: Always prefer Toolkit tools over custom code when available.

**Examples**:
- Deploy → Use `toolkit.vercel_deploy_project`
- Send email → Use `toolkit.resend_send_email`
- Store secret → Use `toolkit.upstash_redis_set`
- Custom logic → Generate code (no suitable tool)

## Testing

### Canonical Test Cases

1. **API + React + Tests**
   ```
   Task: "Add GET /api/notifications endpoint with React list component and tests"
   Expected: Reuses existing services, creates files, passes all gates
   ```

2. **Vercel Deployment**
   ```
   Task: "Deploy to Vercel production"
   Expected: Uses toolkit.vercel_deploy_project, not shell scripts
   ```

3. **Stripe Integration**
   ```
   Task: "Add Stripe checkout flow"
   Expected: Fetches docs via Thinking Tools, uses SDK, includes tests
   ```

## Troubleshooting

### Free Agent not loading tools

Check MCP server status:
```bash
# Verify Free Agent is running
npx @robinson_ai_systems/free-agent-mcp@0.7.3 serve --dry-run

# Check Ollama is accessible
curl http://localhost:11434/api/tags
```

### Quality gates failing

Check environment:
```bash
# Verify build works
npm run build

# Verify tests work
npm test

# Verify linter works
npm run lint
```

### Tool discovery not finding tools

Check toolkit connection:
```bash
# List available categories
# (via Augment or direct MCP call)
toolkit_list_categories

# Search for tools
toolkit_discover { query: "deploy" }
```

## Metrics

Track these metrics for each task:

- Intent classification
- Tools discovered (count)
- Tool selected (name)
- Execution result (success/failure)
- Fallback triggered (yes/no)
- Code generated (yes/no)
- Quality score (0-1)
- Refinement attempts (0-3)
- Final outcome (success/failure)

## Next Steps

1. ✅ Configure environment variables
2. ✅ Reload MCP servers in Augment
3. ✅ Test with canonical tasks
4. 📊 Monitor metrics
5. 🔄 Iterate based on feedback

