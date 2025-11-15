#!/usr/bin/env node
// ESM-friendly launcher for Free Agent MCP
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// If no args provided, default to "serve" mode for MCP
const args = process.argv.slice(2);
if (args.length === 0) {
  process.argv.push('serve');
}

// Load the built CLI
const cliPath = pathToFileURL(resolve(__dirname, '../dist/cli.js')).href;
await import(cliPath);
