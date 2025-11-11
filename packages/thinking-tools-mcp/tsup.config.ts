import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  splitting: false,
  sourcemap: true,
  dts: false,
  clean: true,
  // Inline our shared libs so users don't need them installed
  noExternal: [
    '@robinson_ai_systems/shared-utils',
    '@robinson_ai_systems/robinsons-context-engine'
  ],
});

