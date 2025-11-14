import { defineConfig } from 'tsup';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli.ts',
    'src/generators/ops/index.ts'
  ],
  format: ['cjs'],           // Ship CJS for the server to avoid dynamic require issues
  platform: 'node',
  target: 'node18',
  splitting: false,
  sourcemap: true,
  dts: false,
  clean: true,
  outDir: 'dist',
  // Bundle the internal core + shared libs so consumers don't need them
  noExternal: [
    /^@fa\/core(\/.*)?$/,
    '@robinson_ai_systems/free-agent-core',
    '@robinson_ai_systems/shared-llm',
    '@robinson_ai_systems/shared-utils',
    '@robinson_ai_systems/shared-pipeline'
  ],
  // Never bundle Node built-ins or deps with dynamic requires
  external: [
    'fs', 'path', 'url', 'module', 'os', 'util', 'crypto', 'stream',
    'fast-glob', 'globby', 'chokidar', '@parcel/watcher', '@swc/core', 'diff'
  ],
  esbuildOptions(options) {
    // Resolve @fa/core alias to the actual path
    options.alias = {
      '@fa/core': path.resolve(__dirname, '../free-agent-core/src'),
    };
  },
});

