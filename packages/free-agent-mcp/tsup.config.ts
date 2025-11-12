import { defineConfig } from 'tsup';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: [
    'src/index.ts',                      // MCP server main (stdio)
    'src/cli.ts',                        // CLI wrapper (serve/run)
    'src/generators/ops/index.ts'        // Generator module export
  ],
  format: ['esm'],
  target: 'node22',
  splitting: false,
  sourcemap: true,
  dts: false,  // Disable type definitions for now (tsconfig issues)
  clean: true,
  outDir: 'dist',
  // Bundle the internal core + shared libs so consumers don't need them
  noExternal: [
    /^@fa\/core(\/.*)?$/,                // Bundle internal free-agent-core
    '@robinson_ai_systems/shared-llm',
    '@robinson_ai_systems/shared-utils',
    '@robinson_ai_systems/shared-pipeline'
  ],
  esbuildOptions(options) {
    // Resolve @fa/core alias to the actual path
    options.alias = {
      '@fa/core': path.resolve(__dirname, '../free-agent-core/src'),
    };
  },
});

