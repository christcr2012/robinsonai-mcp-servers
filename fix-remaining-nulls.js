#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Finding and fixing remaining OpenAI null safety issues');
console.log('======================================================\n');

const filePath = path.join('packages', 'robinsons-toolkit-mcp', 'src', 'index.ts');

if (!fs.existsSync(filePath)) {
    console.log('❌ File not found:', filePath);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let changes = 0;
let newLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';
    const nextNextLine = lines[i + 2] || '';
    
    // Look for pattern: private async methodName(args: any) {
    //                   try {
    //                     const response = await this.openaiClient.
    if (line.includes('private async') && line.includes('(args: any) {') &&
        nextLine.trim() === 'try {' &&
        nextNextLine.includes('const') && nextNextLine.includes('await this.openaiClient.')) {
        
        // Check if null check already exists
        const methodStart = i;
        let hasNullCheck = false;
        
        // Look ahead a few lines to see if null check exists
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
            if (lines[j].includes('if (!this.openaiClient)')) {
                hasNullCheck = true;
                break;
            }
        }
        
        if (!hasNullCheck) {
            console.log(`Adding null check to method at line ${i + 1}: ${line.trim()}`);
            
            // Add the method line
            newLines.push(line);
            
            // Add null check
            const indent = line.match(/^(\s*)/)[1]; // Get indentation
            newLines.push(indent + '  if (!this.openaiClient) {');
            newLines.push(indent + '    throw new Error(\'OpenAI client not initialized\');');
            newLines.push(indent + '  }');
            
            changes++;
        } else {
            newLines.push(line);
        }
    } else {
        newLines.push(line);
    }
}

if (changes > 0) {
    const newContent = newLines.join('\n');
    fs.writeFileSync(filePath, newContent);
    console.log(`\n✅ Added ${changes} null checks`);
    console.log('🎉 All OpenAI methods should now have null safety!');
} else {
    console.log('\n⚠️  No additional null checks needed');
}

console.log('\n✨ Done!');
