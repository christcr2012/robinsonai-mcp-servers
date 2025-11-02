#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing robinsons-toolkit-mcp build...');
console.log('==========================================\n');

try {
    process.chdir(path.join('packages', 'robinsons-toolkit-mcp'));
    console.log('📍 Changed to:', process.cwd());
    
    console.log('🔨 Running TypeScript build...');
    const output = execSync('npx tsc', { encoding: 'utf8', stdio: 'pipe' });
    
    console.log('✅ BUILD SUCCESSFUL!');
    console.log('🎉 All TypeScript errors have been fixed!');
    
} catch (error) {
    console.log('❌ BUILD FAILED');
    console.log('Errors:');
    console.log(error.stdout || error.message);
    
    // Count remaining errors
    const errorOutput = error.stdout || error.message;
    const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
    console.log(`\n📊 Found ${errorLines.length} remaining TypeScript errors`);
    
    if (errorLines.length <= 10) {
        console.log('\n🔍 Remaining errors:');
        errorLines.slice(0, 10).forEach(line => console.log('  ', line.trim()));
    }
}

console.log('\n✨ Done!');
