import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli.ts',
    'src/generators/ops/index.ts'
  ],
  format: ['esm'],
  target: 'node22',
  splitting: false,
  sourcemap: true,
  dts: false,
  clean: true,
  outDir: 'dist',
  bundle: false,  // Don't bundle - just transpile TypeScript
});

