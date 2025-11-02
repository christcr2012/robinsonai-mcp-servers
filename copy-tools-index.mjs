#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Copy tools-index.json from src to dist
const srcPath = 'packages/credit-optimizer-mcp/src/tools-index.json';
const distPath = 'packages/credit-optimizer-mcp/dist/tools-index.json';

try {
  console.log('📦 Copying tools-index.json...');
  const content = readFileSync(srcPath, 'utf-8');
  writeFileSync(distPath, content);
  console.log('✅ tools-index.json copied successfully');
  
  // Verify the copy
  const copiedContent = readFileSync(distPath, 'utf-8');
  const data = JSON.parse(copiedContent);
  console.log(`📊 Verified: ${data.totalTools} tools across ${data.categories.length} categories`);
} catch (error) {
  console.error('❌ Failed to copy tools-index.json:', error.message);
  process.exit(1);
}
