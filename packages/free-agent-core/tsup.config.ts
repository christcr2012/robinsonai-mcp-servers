import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts",
    runner: "src/runner.ts",
    "pipeline/index": "src/pipeline/index.ts",
    "spec/codegen": "src/spec/codegen.ts",
    "repo/adapter": "src/repo/adapter.ts",
    "evals/batch": "src/evals/batch.ts",
    "generation/ops-generator-wrapper": "src/generation/ops-generator-wrapper.ts",
  },
  format: ["esm"],
  dts: {
    resolve: true,
    // Skip external modules that are optional (injected by MCP server)
    compilerOptions: {
      skipLibCheck: true,
    },
  },
  external: ["@robinson_ai_systems/shared-llm"], // Optional dependency
  sourcemap: true,
  clean: true,
  shims: true,
  target: "node18",
});

