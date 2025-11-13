#!/usr/bin/env node
/**
 * Fix FastAPI handler names to match broker expectations
 * Uses the broker's getHandlerFunctionName logic as single source of truth
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

console.log('🔧 Fixing FastAPI handler names to match broker expectations...\n');

// Broker's getHandlerFunctionName logic (from src/index.ts lines 409-417)
function getHandlerFunctionName(toolName) {
  const parts = toolName.split('_');
  const capitalized = parts.map((p, i) =>
    i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)
  ).join('');
  return capitalized;
}

// Load registry to get all FastAPI tool names
const registryPath = path.join(root, 'dist', 'registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const fastapiTools = (Array.isArray(registry) ? registry : registry.tools || [])
  .filter(t => t.category === 'fastapi');

console.log(`📊 Found ${fastapiTools.length} FastAPI tools\n`);

// Build mapping: old name (lowercase) -> new name (camelCase)
const renameMap = new Map();
fastapiTools.forEach(tool => {
  const oldName = tool.name.replace(/_/g, '').toLowerCase(); // Current: all lowercase
  const newName = getHandlerFunctionName(tool.name); // Expected: camelCase
  if (oldName !== newName) {
    renameMap.set(oldName, newName);
  }
});

console.log(`🔄 Need to rename ${renameMap.size} handlers\n`);

// Find all handler files that might have FastAPI aliases
const handlerFiles = [
  'src/categories/postgres/handlers.ts',
  'src/categories/neo4j/handlers.ts',
  'src/categories/qdrant/handlers.ts',
  'src/categories/langchain/handlers.ts',
  'src/categories/gateway/handlers.ts',
  'src/categories/health/handlers.ts',
];

let totalChanges = 0;

handlerFiles.forEach(file => {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${file} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let fileChanges = 0;

  // Replace export const oldName = ... with export const newName = ...
  renameMap.forEach((newName, oldName) => {
    const pattern = new RegExp(`export const ${oldName}\\b`, 'g');
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, `export const ${newName}`);
      fileChanges += matches.length;
      console.log(`  ✅ ${file}: ${oldName} → ${newName}`);
    }
  });

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalChanges += fileChanges;
    console.log(`  📝 Updated ${file} (${fileChanges} changes)\n`);
  }
});

console.log(`\n✅ Fixed ${totalChanges} FastAPI handler names across ${handlerFiles.length} files`);

