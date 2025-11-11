# Portable Free Agent Architecture

## Overview

Free Agent has been refactored into a **portable, repo-agnostic core** that can run against any repository on disk. This enables:

- **Single codebase** for all Free Agent logic
- **Per-repo adapters** for custom commands (optional)
- **Spec-first codegen** from global registries (not repo-bound)
- **Quality gates** that work identically everywhere
- **CLI** to target any repository

## Architecture

### Pack RA: Portable Core

**Package**: `@robinson_ai_systems/free-agent-core` (v1.0.0)

Core modules:
- `cli.ts` - CLI entry point with `--repo`, `--task`, `--kind`
- `runner.ts` - Orchestrates adapter loading and pipeline
- `repo/adapter.ts` - Adapter interface and defaults
- `repo/discover.ts` - Auto-discovery of repo structure
- `repo/prompts.ts` - LLM prompt building (stub for your provider)
- `pipeline/index.ts` - Quality gates loop
- `pipeline/quality.ts` - ESLint, TypeScript, tests
- `spec/codegen.ts` - Spec registry loading and codegen
- `spec/generator.ts` - Pure function to generate handlers
- `shared/patchGuard.ts` - Validates diffs before applying
- `shared/diff.ts` - Git apply wrapper

### Pack RB: Per-Repo Adapters

**File**: `.free-agent/config.json` (optional)

Example for monorepo:
```json
{
  "name": "robinsonai-mcp-servers",
  "cmd": {
    "install": "pnpm i",
    "eslint": "pnpm -w lint",
    "tsc": "pnpm -w tsc --noEmit",
    "tests": "pnpm -w vitest run"
  },
  "specRegistry": "packages/free-agent-mcp/spec/tools.registry.json",
  "codegenOutDir": ".free-agent/.generated"
}
```

If no config exists, Free Agent auto-discovers:
- Package manager: `pnpm` or `npm`
- Linter: `npx eslint . --max-warnings=0`
- Type checker: `npx tsc --noEmit`
- Tests: `npx vitest run`

### Pack RC: Spec Registry (Repo-Agnostic)

**Environment**: `FREE_AGENT_SPEC`

Set once globally or per-repo:
```bash
# File path
export FREE_AGENT_SPEC=/abs/path/tools.registry.json

# HTTP URL
export FREE_AGENT_SPEC=https://your-host/tools.registry.json
```

Handlers are generated into:
- Temp directory (if no `codegenOutDir`)
- `.free-agent/.generated` (if configured)

**Not** committed to any repo.

### Pack RD: CLI Usage

```bash
# Install globally or use pnpm dlx
pnpm add -g @robinson_ai_systems/free-agent-core

# Run against any repo
free-agent --repo /path/to/repo --task "Implement feature X" --kind feature

# Or use pnpm dlx
pnpm dlx @robinson_ai_systems/free-agent-core --repo /path/to/repo --task "Fix bug Y" --kind bugfix
```

## Adapter Interface

```typescript
type Adapter = {
  name: string;
  cmd: Cmds;
  specRegistry?: string;
  codegenOutDir?: string;
  prepare(repo: string): Promise<void>;
  run(repo: string, cmd: string): Promise<{ code: number; out: string }>;
  synthesize(args: { repo: string; task: string; kind: string }): Promise<{ diff: string }>;
  refine(args: { repo: string; task: string; diagnostics: any; lastDiff: string }): Promise<{ diff: string }>;
  applyPatch(repo: string, unifiedDiff: string): Promise<void>;
};
```

## Pipeline

1. **Discover**: Find `.free-agent/config.json` or use defaults
2. **Load Adapter**: Per-repo config or auto-discovery
3. **Prepare**: Install dependencies
4. **Codegen**: Generate handlers from spec registry
5. **Synthesize**: LLM generates initial code (unified diff)
6. **Apply**: Patch guard validates, then git apply
7. **Quality Gates**: ESLint, TypeScript, tests
8. **Refine**: If gates fail, refine and retry (max 3 attempts)

## Spec-First Codegen

Handlers are generated from a registry (not hand-coded):

```typescript
import { generateFromRegistry } from "@robinson_ai_systems/free-agent-core/spec";

const code = generateFromRegistry({
  services: {
    api: {
      baseEnv: "API_URL",
      defaultBase: "https://api.example.com",
      endpoints: {
        get_user: {
          path: "/users/{id}",
          method: "GET",
          pathParams: ["id"],
        },
      },
    },
  },
});
```

## Patch Guard

Validates diffs before applying:

```typescript
import { validatePatchUnifiedDiff } from "@robinson_ai_systems/free-agent-core";

validatePatchUnifiedDiff(diff); // Throws if invalid
```

Rejects:
- Placeholders: "Placeholder for real implementation"
- `any` types in added lines
- Fake paths: "path/to/gateway/handlers.ts"
- Hardcoded collections: "default_collection"
- TODO/FIXME comments

## LLM Integration

The `buildAdapterPrompt()` function in `repo/prompts.ts` is a stub. Wire your LLM provider:

```typescript
// repo/prompts.ts
export async function buildAdapterPrompt(repo: string, task: string, cfg: any) {
  const system = "...";
  const context = "...";
  const user = "...";

  // TODO: Wire your LLM provider here
  const response = await yourLLM.generate({ system, user });
  return response.diff;
}
```

Supported providers:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Local (Ollama, LM Studio)
- Custom

## Environment Variables

- `FREE_AGENT_SPEC`: Path or URL to spec registry
- `FREE_AGENT_GENERATED_HANDLERS`: Path to generated handlers (set by codegen)

## Why This Architecture

### Portability
- Single codebase runs against any repo
- No repo-specific logic in core
- Adapters are just JSON config

### Extensibility
- Per-repo adapters for custom commands
- Spec registry can be shared or per-repo
- LLM provider is pluggable

### Quality
- Spec-first codegen prevents hallucinations
- Patch guard validates before applying
- Quality gates run identically everywhere

### Simplicity
- CLI is straightforward: `--repo`, `--task`, `--kind`
- Auto-discovery works without config
- Minimal dependencies (zod only)

## Next Steps

1. **Wire LLM provider** in `repo/prompts.ts`
2. **Test against multiple repos** to validate adapters
3. **Create shared spec registries** for common APIs
4. **Integrate with CI/CD** for automated code generation
5. **Build UI** for task management and monitoring

