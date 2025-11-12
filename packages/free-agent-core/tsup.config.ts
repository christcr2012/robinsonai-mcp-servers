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
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  target: "node18",
});

