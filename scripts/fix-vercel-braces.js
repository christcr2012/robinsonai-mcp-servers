const fs = require('fs');

const filePath = 'packages/robinsons-toolkit-mcp/src/index.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const fixed = [];
let skipNext = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Skip lines that are just opening braces in the Vercel section (lines 644-1152)
  if (i >= 643 && i <= 1152) {
    if (trimmed === '{') {
      skipNext = false;
      continue; // Skip this line
    }
    if (trimmed === '},') {
      skipNext = false;
      continue; // Skip this line
    }
  }
  
  fixed.push(line);
}

fs.writeFileSync(filePath, fixed.join('\n'));
console.log('✅ Fixed Vercel tool braces');

