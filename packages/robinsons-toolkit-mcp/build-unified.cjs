#!/usr/bin/env node
const fs = require('fs');
console.log('Building unified server...');
const content = fs.readFileSync('src/index.ts', 'utf-8');
console.log(`File size: ${content.length} chars`);
console.log(`Has GitHubMCP: ${content.includes('class GitHubMCP')}`);
console.log(`Has VercelMCP: ${content.includes('class VercelMCP')}`);
console.log(`Has NeonMCP: ${content.includes('class NeonMCP')}`);
