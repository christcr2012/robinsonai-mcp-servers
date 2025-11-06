#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../packages/robinsons-toolkit-mcp/src/index.ts');
const handlersPath = path.join(__dirname, '../packages/robinsons-toolkit-mcp/generated-handlers.txt');

console.log('📝 Inserting handlers into index.ts...\n');

// Read files
const indexContent = fs.readFileSync(indexPath, 'utf8');
const handlersContent = fs.readFileSync(handlersPath, 'utf8');

// Find the closing brace of the UnifiedToolkit class
// It's the '}' right before the console.error line
const lines = indexContent.split('\n');
let closingBraceIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('console.error("[Robinson Toolkit] Initializing...")')) {
    // Found the line after the class, go back to find the closing brace
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].trim() === '}') {
        closingBraceIndex = j;
        break;
      }
    }
    break;
  }
}

if (closingBraceIndex === -1) {
  console.error('❌ Could not find closing brace of UnifiedToolkit class');
  process.exit(1);
}

console.log(`✅ Found closing brace at line ${closingBraceIndex + 1}`);

// Insert handlers before the closing brace
const before = lines.slice(0, closingBraceIndex).join('\n');
const after = lines.slice(closingBraceIndex).join('\n');

const newContent = before + '\n\n  // ========== AUTO-GENERATED HANDLERS ==========\n\n' + handlersContent + '\n\n  // ========== END AUTO-GENERATED HANDLERS ==========\n\n' + after;

// Write back
fs.writeFileSync(indexPath, newContent);

console.log(`✅ Inserted ${handlersContent.split('\n').length} lines of handlers`);
console.log('✨ Done!\n');

