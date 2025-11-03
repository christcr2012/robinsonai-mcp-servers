#!/usr/bin/env node
// ESM-friendly launcher
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// load compiled entry
const dist = pathToFileURL(resolve(__dirname, '../dist/index.js')).href;
await import(dist);

