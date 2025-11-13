#!/usr/bin/env node
/**
 * Print expected handler names for FastAPI tools using broker's logic
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

// Load registry
const registryPath = path.join(root, 'dist', 'registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

// Get FastAPI tools (registry is an array, not an object with .tools)
const fastapiTools = (Array.isArray(registry) ? registry : registry.tools || [])
  .filter(t => t.category === 'fastapi');

console.log('🔍 FastAPI Tools - Expected Handler Names (using broker logic)\n');
console.log('Total FastAPI tools:', fastapiTools.length, '\n');

// Broker's getHandlerFunctionName logic (from src/index.ts lines 409-417)
function getHandlerFunctionName(toolName) {
  const parts = toolName.split('_');
  const capitalized = parts.map((p, i) =>
    i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)
  ).join('');
  return capitalized;
}

// Print expected names
fastapiTools.forEach(tool => {
  const expected = getHandlerFunctionName(tool.name);
  console.log(`${tool.name} => ${expected}`);
});

console.log('\n✅ Done');

