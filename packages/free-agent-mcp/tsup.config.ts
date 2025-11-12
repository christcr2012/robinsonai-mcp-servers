import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',                      // MCP server main
    'src/generators/ops/index.ts'        // Generator module
  ],
  format: ['esm'],
  target: 'node22',
  splitting: false,
  sourcemap: true,
  dts: false,  // Disable type definitions for now (tsconfig issues)
  clean: true,
  // Inline our shared libs so users don't need them installed
  noExternal: [
    '@robinson_ai_systems/shared-llm',
    '@robinson_ai_systems/shared-utils',
    '@robinson_ai_systems/shared-pipeline'
  ],
});

