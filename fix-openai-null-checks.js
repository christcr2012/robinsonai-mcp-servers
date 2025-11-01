#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing OpenAI null safety issues in robinsons-toolkit-mcp');
console.log('===========================================================\n');

const filePath = path.join('packages', 'robinsons-toolkit-mcp', 'src', 'index.ts');

if (!fs.existsSync(filePath)) {
    console.log('❌ File not found:', filePath);
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// Pattern to find methods that use this.openaiClient without null check
const patterns = [
    // Find methods that directly use this.openaiClient.* without null check
    {
        regex: /(private async \w+\([^)]*\) \{[\s\n]*)(try \{[\s\n]*)(const \w+ = await this\.openaiClient\.)/g,
        replacement: '$1if (!this.openaiClient) {\n      throw new Error(\'OpenAI client not initialized\');\n    }\n    $2$3'
    }
];

patterns.forEach(pattern => {
    const matches = content.match(pattern.regex);
    if (matches) {
        console.log(`Found ${matches.length} matches for pattern`);
        content = content.replace(pattern.regex, pattern.replacement);
        changes += matches.length;
    }
});

// Also fix the vectorStores issue by removing those methods entirely
console.log('\n🔧 Removing vectorStores methods (not available in this OpenAI version)...');

const vectorStoresMethods = [
    'openaiCreateVectorStore',
    'openaiListVectorStores', 
    'openaiRetrieveVectorStore',
    'openaiUpdateVectorStore',
    'openaiDeleteVectorStore',
    'openaiCreateVectorStoreFile',
    'openaiListVectorStoreFiles',
    'openaiRetrieveVectorStoreFile',
    'openaiDeleteVectorStoreFile',
    'openaiCreateVectorStoreFileBatch',
    'openaiRetrieveVectorStoreFileBatch',
    'openaiCancelVectorStoreFileBatch'
];

vectorStoresMethods.forEach(methodName => {
    // Remove the method implementation
    const methodRegex = new RegExp(`private async ${methodName}\\([^}]+\\}[\\s\\n]*\\}[\\s\\n]*\\}`, 'g');
    const beforeLength = content.length;
    content = content.replace(methodRegex, '');
    if (content.length < beforeLength) {
        console.log(`✅ Removed ${methodName} method`);
        changes++;
    }
});

// Fix the deprecated file_ids properties
console.log('\n🔧 Fixing deprecated file_ids properties...');

// Remove file_ids from AssistantCreateParams
content = content.replace(/file_ids: args\.file_ids,?\n?/g, '');
changes++;

if (changes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`\n✅ Applied ${changes} fixes to ${filePath}`);
    console.log('🎉 TypeScript errors should now be resolved!');
} else {
    console.log('\n⚠️  No changes needed');
}

console.log('\n✨ Done!');
