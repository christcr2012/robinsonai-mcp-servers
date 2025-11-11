# Portable Free Agent: Quick Start

## Installation

```bash
# Global
pnpm add -g @robinson_ai_systems/free-agent-core

# Or use pnpm dlx (no installation needed)
pnpm dlx @robinson_ai_systems/free-agent-core --repo /path/to/repo --task "Your task" --kind feature
```

## Basic Usage

```bash
# Run against any repository
free-agent --repo /path/to/repo --task "Implement feature X" --kind feature

# With spec registry
export FREE_AGENT_SPEC=https://your-host/tools.registry.json
free-agent --repo /path/to/repo --task "Fix bug Y" --kind bugfix

# Different task kinds
free-agent --repo /path/to/repo --task "..." --kind feature    # New feature
free-agent --repo /path/to/repo --task "..." --kind bugfix     # Bug fix
free-agent --repo /path/to/repo --task "..." --kind refactor   # Refactoring
free-agent --repo /path/to/repo --task "..." --kind research   # Research/analysis
```

## Per-Repo Configuration (Optional)

Create `.free-agent/config.json` in your repository:

```json
{
  "name": "my-repo",
  "cmd": {
    "install": "pnpm i",
    "eslint": "pnpm lint",
    "tsc": "pnpm tsc --noEmit",
    "tests": "pnpm vitest run"
  },
  "specRegistry": "https://your-host/tools.registry.json",
  "codegenOutDir": ".free-agent/.generated"
}
```

If no config exists, Free Agent auto-discovers:
- Package manager: `pnpm` or `npm`
- Linter: `npx eslint . --max-warnings=0`
- Type checker: `npx tsc --noEmit`
- Tests: `npx vitest run`

## Spec Registry

Set the spec registry globally or per-repo:

```bash
# File path
export FREE_AGENT_SPEC=/abs/path/tools.registry.json

# HTTP URL
export FREE_AGENT_SPEC=https://your-host/tools.registry.json
```

Handlers are generated from the registry into:
- Temp directory (if no `codegenOutDir`)
- `.free-agent/.generated` (if configured)

## Programmatic Usage

```typescript
import { runFreeAgent } from "@robinson_ai_systems/free-agent-core";

await runFreeAgent({
  repo: "/path/to/repo",
  task: "Implement feature X",
  kind: "feature",
});
```

## How It Works

1. **Discover**: Find `.free-agent/config.json` or use defaults
2. **Load Adapter**: Per-repo config or auto-discovery
3. **Prepare**: Install dependencies
4. **Codegen**: Generate handlers from spec registry
5. **Synthesize**: LLM generates initial code (unified diff)
6. **Apply**: Patch guard validates, then git apply
7. **Quality Gates**: ESLint, TypeScript, tests
8. **Refine**: If gates fail, refine and retry (max 3 attempts)

## Patch Guard

Automatically rejects patches with:
- Placeholders: "Placeholder for real implementation"
- `any` types in added lines
- Fake paths: "path/to/gateway/handlers.ts"
- Hardcoded collections: "default_collection"
- TODO/FIXME comments

## Environment Variables

- `FREE_AGENT_SPEC`: Path or URL to spec registry
- `FREE_AGENT_GENERATED_HANDLERS`: Path to generated handlers (set by codegen)

## Examples

### Example 1: Simple Feature

```bash
free-agent \
  --repo ~/my-project \
  --task "Add user authentication with JWT" \
  --kind feature
```

### Example 2: Bug Fix with Custom Config

```bash
# Create .free-agent/config.json in ~/my-project
free-agent \
  --repo ~/my-project \
  --task "Fix race condition in cache invalidation" \
  --kind bugfix
```

### Example 3: Monorepo with Spec Registry

```bash
export FREE_AGENT_SPEC=https://api.example.com/spec.json
free-agent \
  --repo ~/monorepo \
  --task "Generate API handlers for new endpoints" \
  --kind feature
```

### Example 4: Refactoring

```bash
free-agent \
  --repo ~/legacy-project \
  --task "Refactor authentication module to use dependency injection" \
  --kind refactor
```

## Troubleshooting

### "No spec registry"
Set `FREE_AGENT_SPEC` or add `specRegistry` to `.free-agent/config.json`

### "Quality gates failed"
Check the error output. Free Agent will refine up to 3 times.

### "Patch rejected by policy"
The patch contains forbidden patterns. Check the error message.

### "git apply failed"
Ensure the repository is clean and has no uncommitted changes.

## Next Steps

1. **Wire LLM provider** - Edit `repo/prompts.ts` to call your LLM
2. **Create spec registry** - Define your API endpoints
3. **Test with multiple repos** - Validate adapters
4. **Integrate with CI/CD** - Automate code generation

## Documentation

- **Architecture**: `.augment/PORTABLE_ARCHITECTURE.md`
- **Implementation**: `.augment/PORTABLE_IMPLEMENTATION_SUMMARY.md`
- **Package README**: `packages/free-agent-core/README.md`

## Support

- GitHub: https://github.com/christcr2012/robinsonai-mcp-servers
- npm: https://www.npmjs.com/package/@robinson_ai_systems/free-agent-core

