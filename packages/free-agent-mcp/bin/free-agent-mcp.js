#!/usr/bin/env node
// ESM-friendly launcher
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Parse command-line arguments for --workspace-root
const args = process.argv.slice(2);
const workspaceRootIndex = args.indexOf('--workspace-root');

if (workspaceRootIndex !== -1 && args[workspaceRootIndex + 1]) {
  // Set WORKSPACE_ROOT environment variable from command-line argument
  process.env.WORKSPACE_ROOT = args[workspaceRootIndex + 1];
  console.error(`[Wrapper] Set WORKSPACE_ROOT from CLI: ${process.env.WORKSPACE_ROOT}`);
}

// load compiled entry
const dist = pathToFileURL(resolve(__dirname, '../dist/index.js')).href;
await import(dist);
