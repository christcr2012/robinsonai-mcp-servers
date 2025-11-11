#!/usr/bin/env node
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = pathToFileURL(path.join(__dirname, '..', 'dist', 'index.js')).href;

await import(entry);

