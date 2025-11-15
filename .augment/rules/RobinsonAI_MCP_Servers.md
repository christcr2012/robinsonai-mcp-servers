---
type: "always_apply"
---

# RobinsonAI MCP Servers – Master Instructions for Augment

You are working in the repository: `robinsonai-mcp-servers-main`.

Your goals:

1. All four MCP servers work on **Windows** and **non-Windows**:
   - `@robinson_ai_systems/free-agent-mcp`
   - `@robinson_ai_systems/paid-agent-mcp`
   - `@robinson_ai_systems/thinking-tools-mcp`
   - `@robinson_ai_systems/robinsons-toolkit-mcp`
2. Augment uses the **published npm packages**, not the local workspace builds.
3. Dynamic imports + bundling are **Windows-safe** (no `protocol 'c:'` ESM errors).
4. We can validate everything with the existing test scripts in `scripts/`.

---

## 0. HARD GUARDRAILS (DO NOT BREAK THESE)

1. **Never edit compiled output**  
   - Do **not** edit anything under any `dist/` directories.  
   - Only modify:
     - `packages/**/src/**/*.ts`
     - `packages/**/tsup.config.ts`
     - `packages/**/package.json`
     - scripts under `scripts/`
2. **Do not randomly switch packaging strategies**
   - Keep the existing pattern:
     - Internal monorepo packages are bundled or aliased via `noExternal` / `alias`.
     - Heavy native / dynamic-require deps (e.g. `pg`, `better-sqlite3`, `fast-glob`, `chokidar`) stay in `external` **and** are listed in `dependencies`.
3. **Dynamic import rules (VERY IMPORTANT)**  
   When you see `await import(...)`, identify which of these it is:

   **A. Filesystem path (may become `C:\...` on Windows)**  
   - Example: handlers, generator modules, repo-relative files.
   - Required pattern:
     ```ts
     import path from "node:path";
     import { pathToFileURL } from "node:url";

     const ws = process.env.WORKSPACE_ROOT || process.cwd();
     const abs = path.isAbsolute(input)
       ? input
       : path.resolve(ws, input);
     const fileUrl = pathToFileURL(abs).href;
     const mod = await import(fileUrl);
     ```
   - You MUST resolve to absolute path + `pathToFileURL` before importing.

   **B. Package/bare specifier (e.g. `"@fa/core/spec"`, `"ollama"`)**  
   - Never convert these to file URLs.
   - Prefer **static imports at the top of the file** if possible:
     ```ts
     import { ensureCodegen } from "@fa/core/spec/codegen.js";
     ```
   - If you keep them dynamic, they must remain simple package strings, not paths.

   **C. Local relative module (`"./pipeline/index.js"`, `"./utils/..."`)**  
   - These are fine as either static imports or dynamic `await import("./...")`.
   - Do **not** convert them to file URLs.
   - Only change them if there’s a clear reason (e.g. bundling issue).

4. **Follow the core utilities instead of re-inventing logic**
   - Use `packages/free-agent-core/src/utils/paths.ts` for:
     - `findWorkspaceRoot`
     - `resolveRepoRoot`
     - `resolveFromRepo`
   - Use `packages/free-agent-core/src/generation/loader.ts` for generator loading:
     - `resolveGeneratorSpecifier`
     - `loadGeneratorFactory`
   - Don’t re-implement these concepts elsewhere; reuse them.

---

## 1. REPOSITORY MAP (WHAT LIVES WHERE)

- `packages/free-agent-core`  
  Shared logic for repo resolution, generator loading, etc.

- `packages/free-agent-mcp`  
  Free Agent MCP server + CLI.  
  - Entry: `src/index.ts`  
  - CLI: `src/cli.ts` (modes: `serve` and `run`)

- `packages/paid-agent-mcp`  
  Paid Agent MCP, similar structure to Free Agent.

- `packages/thinking-tools-mcp`  
  Tools-only MCP server (no repo patching).

- `packages/robinsons-toolkit-mcp`  
  Massive toolkit MCP; dynamically loads handler files from registry.

- `scripts/`  
  Contains **existing test harnesses**. These must be used, not replaced, for validation, especially:
  - `scripts/test-published-packages.mjs`
  - `scripts/test-published-mcps-external.mjs`
  - `scripts/test-free-agent-windows-fix.mjs`
  - `scripts/test-phase8-*` test scenarios

---

## 2. PACKAGING & BUILD RULES (ALL MCP PACKAGES)

For each MCP package: `free-agent-mcp`, `paid-agent-mcp`, `thinking-tools-mcp`, `robinsons-toolkit-mcp`:

1. **Verify `tsup.config.ts`**
   - Leave `entry`, `format`, `platform`, `target` as-is.
   - Ensure all internal monorepo libs are listed in `noExternal`:
     - `@robinson_ai_systems/free-agent-core`
     - `@robinson_ai_systems/shared-llm`
     - `@robinson_ai_systems/shared-utils`
     - `@robinson_ai_systems/shared-pipeline`
   - Ensure dynamic-require / native deps stay in `external`:
     - `pg`, `pg-native`, `better-sqlite3`
     - `fast-glob`, `globby`, `chokidar`, `@parcel/watcher`, `@swc/core`
   - Do **not** try to bundle these.

2. **Verify `package.json` dependencies**
   - Every module listed in `external` MUST also appear in `"dependencies"`.
   - If you add anything to `external`, also add it to `dependencies` with a semver range consistent with the rest of the repo.

3. **ESM + alias handling**
   - Keep the `@fa/core` alias configured like in `free-agent-mcp/tsup.config.ts`:
     ```ts
     options.alias = {
       "@fa/core": path.resolve(__dirname, "../free-agent-core/src"),
     };
     ```
   - Don’t introduce new aliases without a good reason.

4. **Build command (monorepo root)**
   - Always build from the root:
     ```bash
     pnpm install
     pnpm -w build
     ```

---

## 3. MCP CONFIGURATION FOR AUGMENT (PUBLISHED PACKAGES ONLY)

When editing `augment-mcp-config.json` (or equivalent), follow this pattern on Windows:

- Use `pnpm.cmd dlx` with **pinned versions** for all RobinsonAI MCPs.

Example (update versions as needed – these are the ones in this repo right now):

```jsonc
{
  "mcpServers": {
    "Free Agent MCP": {
      "command": "pnpm.cmd",
      "args": [
        "dlx",
        "@robinson_ai_systems/free-agent-mcp@0.14.14"
      ],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "MCP_LOG_LEVEL": "debug",
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "OLLAMA_PRIMARY_MODEL": "qwen2.5-coder:7b",
        "OLLAMA_FALLBACK_MODEL": "deepseek-coder:1.3b",
        "OLLAMA_EMBEDDING_MODEL": "nomic-embed-text"
        // ... keep user’s existing FREE_AGENT_* and quality settings
      }
    },

    "Paid Agent MCP": {
      "command": "pnpm.cmd",
      "args": [
        "dlx",
        "@robinson_ai_systems/paid-agent-mcp@0.12.9"
      ],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "MCP_LOG_LEVEL": "debug"
        // ... paid provider keys & config live here, do not change them
      }
    },

    "Thinking Tools MCP": {
      "command": "pnpm.cmd",
      "args": [
        "dlx",
        "@robinson_ai_systems/thinking-tools-mcp@1.27.3"
      ],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "MCP_LOG_LEVEL": "debug"
      }
    },

    "Robinson's Toolkit MCP": {
      "command": "pnpm.cmd",
      "args": [
        "dlx",
        "@robinson_ai_systems/robinsons-toolkit-mcp@1.19.3"
      ],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "MCP_LOG_LEVEL": "debug"
      }
    }
  }
}
