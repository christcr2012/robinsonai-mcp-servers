import { defineConfig } from 'tsup';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/generators/ops/index.ts'
  ],
  format: ['esm'],
  target: 'node22',
  splitting: false,
  sourcemap: true,
  dts: false,
  clean: true,
  // Bundle internal packages so consumers don't need them installed
  noExternal: [
    /^@fa\/core(\/.*)?$/,
    '@robinson_ai_systems/agent-core',
    '@robinson_ai_systems/shared-llm',
    '@robinson_ai_systems/shared-utils',
    '@robinson_ai_systems/shared-pipeline'
  ],
  // Never bundle Node built-ins or deps with dynamic require()
  external: [
    'fs', 'path', 'url', 'module', 'os', 'util', 'crypto', 'stream',
    'better-sqlite3',
    'pg',
    'pg-native',
    'fast-glob'
  ],
  esbuildOptions(options) {
    // Resolve @fa/core alias to the actual path
    options.alias = {
      '@fa/core': path.resolve(__dirname, '../agent-core/src'),
    };
  },
});

