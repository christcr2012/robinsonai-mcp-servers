#!/usr/bin/env node

/**
 * Extract OpenAI tools from the standalone MCP server for integration into Robinson's toolkit
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Analyzing OpenAI MCP Server Structure...');

// Read the OpenAI MCP source file
const openaiMcpPath = join(process.cwd(), 'packages/openai-mcp/src/index.ts');
const content = readFileSync(openaiMcpPath, 'utf8');

// Extract all tool definitions
const toolRegex = /{\s*name:\s*"(openai_[^"]+)",\s*description:\s*"([^"]+)",\s*inputSchema:\s*{[^}]*(?:}[^}]*)*}/gs;
const toolMatches = [...content.matchAll(toolRegex)];

console.log(`📊 Found ${toolMatches.length} OpenAI tools`);

// Extract tool names and descriptions
const tools = [];
const toolNameRegex = /name:\s*"(openai_[^"]+)"/g;
const allToolNames = [...content.matchAll(toolNameRegex)];

console.log(`📋 Tool names found: ${allToolNames.length}`);

// Group tools by category based on comments in the source
const categories = {
  'Chat & Completions': [],
  'Embeddings': [],
  'Images': [],
  'Audio': [],
  'Moderation': [],
  'Models': [],
  'Files': [],
  'Fine-tuning': [],
  'Batch API': [],
  'Assistants': [],
  'Threads': [],
  'Messages': [],
  'Runs': [],
  'Vector Stores': [],
  'Cost Management': [],
  'Usage & Billing': [],
  'Projects & Organization': [],
  'Users & Invites': [],
  'Rate Limits': [],
  'Advanced Features': [],
  'Realtime API': [],
  'Vision API': [],
  'Safety & Compliance': [],
  'Monitoring': [],
  'Prompt Engineering': [],
  'Token Management': [],
  'Model Comparison': [],
  'Agents SDK': [],
  'Other': []
};

// Extract tools with their categories
allToolNames.forEach(match => {
  const toolName = match[1];
  tools.push(toolName);
});

console.log(`✅ Extracted ${tools.length} tool names`);

// Write results
const results = {
  totalTools: tools.length,
  tools: tools,
  categories: Object.keys(categories),
  extractedAt: new Date().toISOString()
};

writeFileSync('openai-tools-analysis.json', JSON.stringify(results, null, 2));

console.log('📄 Analysis saved to openai-tools-analysis.json');
console.log(`🎯 Ready to integrate ${tools.length} OpenAI tools into Robinson's toolkit!`);
