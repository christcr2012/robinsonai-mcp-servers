import { defineConfig } from 'tsup';
import fg from 'fast-glob';

// Find all handler files in categories
const handlerFiles = fg.sync('src/categories/**/handlers.ts');

export default defineConfig({
  entry: ['src/index.ts', 'src/all-tools.ts', ...handlerFiles],
  format: ['esm'],
  target: 'node22',
  splitting: false,
  sourcemap: true,
  dts: false,
  clean: true,
  // Inline our shared libs so users don't need them installed
  noExternal: [
    '@robinson_ai_systems/shared-llm',
    '@robinson_ai_systems/shared-utils',
    '@robinson_ai_systems/shared-pipeline'
  ],
  // IMPORTANT: Never bundle Node built-ins or deps with dynamic require()
  // This prevents bundling issues and keeps the build stable
  external: [
    'fs', 'path', 'url', 'module', 'os', 'util', 'crypto', 'stream',
    'fast-glob', 'globby', 'chokidar', '@parcel/watcher', '@swc/core'
  ],
});

