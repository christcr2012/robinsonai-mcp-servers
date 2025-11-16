# Agent Core

Portable, repo-agnostic agent core with spec-first codegen and quality gates. Shared by Free Agent and Paid Agent MCPs.

## Features

- **Portable**: Runs anywhere, not tied to any repository
- **CLI**: `--repo`, `--task`, `--kind` arguments for any repository
- **Auto-discovery**: Works without per-repo configuration
- **Per-repo adapters**: Optional `.free-agent/config.json` for custom commands
- **Spec-first codegen**: Registry path/URL, not repo-bound
- **Quality gates**: Build/lint/test loop with refinement
- **Patch guard**: Validates diffs before applying
- **Handlers generated**: To temp dir or `.free-agent/.generated`

## Installation

```bash
pnpm add @robinson_ai_systems/agent-core
```

## Usage

### CLI

```bash
# Run against any repository
pnpm free-agent --repo /path/to/repo --task "Implement feature X" --kind feature

# With spec registry
export FREE_AGENT_SPEC=https://your-host/tools.registry.json
pnpm free-agent --repo /path/to/repo --task "Fix bug Y" --kind bugfix
```

### Programmatic

```typescript
import { runFreeAgent } from "@robinson_ai_systems/agent-core";

await runFreeAgent({
  repo: "/path/to/repo",
  task: "Implement feature X",
  kind: "feature",
});
```

## Per-Repo Configuration

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

Set the spec registry via environment variable or adapter config:

```bash
# File path
export FREE_AGENT_SPEC=/abs/path/tools.registry.json

# HTTP URL
export FREE_AGENT_SPEC=https://your-host/tools.registry.json
```

Handlers are generated from the registry into a temp directory or `.free-agent/.generated`.

## Architecture

### Adapter Interface

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

### Pipeline

1. **Prepare**: Install dependencies, bootstrap
2. **Synthesize**: Generate initial code via LLM
3. **Apply**: Apply patch with validation
4. **Quality Gates**: Run eslint, tsc, tests
5. **Refine**: If gates fail, refine and retry (max 3 attempts)

### Spec-First Codegen

Handlers are generated from a registry:

```typescript
import { generateFromRegistry } from "@robinson_ai_systems/agent-core/spec";

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
import { validatePatchUnifiedDiff } from "@robinson_ai_systems/agent-core";

validatePatchUnifiedDiff(diff); // Throws if invalid
```

Rejects:
- Placeholders: "Placeholder for real implementation"
- `any` types in added lines
- Fake paths: "path/to/gateway/handlers.ts"
- Hardcoded collections: "default_collection"
- TODO/FIXME comments

## Environment Variables

- `FREE_AGENT_SPEC`: Path or URL to spec registry
- `FREE_AGENT_GENERATED_HANDLERS`: Path to generated handlers (set by codegen)

## License

MIT

