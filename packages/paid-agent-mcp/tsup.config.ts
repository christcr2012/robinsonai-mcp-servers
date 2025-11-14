import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  splitting: false,
  sourcemap: true,
  dts: false,
  clean: true,
  // Bundle internal packages so consumers don't need them installed
  noExternal: [
    '@robinson_ai_systems/shared-llm',
    '@robinson_ai_systems/shared-utils',
    '@robinson_ai_systems/shared-pipeline'
  ],
  // Never bundle Node built-ins or deps with dynamic require()
  external: [
    'fs', 'path', 'url', 'module', 'os', 'util', 'crypto', 'stream',
    'better-sqlite3'
  ],
});

