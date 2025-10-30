#!/usr/bin/env node
/**
 * Standardize Vercel tools to single-line compact format
 * Converts from multi-line format to match GitHub/Neon/Upstash style
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../packages/robinsons-toolkit-mcp/src/index.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Find all Vercel tools (multi-line format)
const vercelToolRegex = /\{\s*name:\s*"(vercel_[^"]+)",\s*description:\s*"([^"]+)",\s*inputSchema:\s*\{[^}]*type:\s*"object",\s*properties:\s*\{([^}]+)\}(?:,\s*required:\s*\[([^\]]*)\])?\s*\},?\s*\},?/gs;

let newContent = content;
let match;
let replacements = 0;

// Convert each multi-line Vercel tool to single-line format
while ((match = vercelToolRegex.exec(content)) !== null) {
  const fullMatch = match[0];
  const name = match[1];
  const description = match[2];
  const propertiesStr = match[3];
  const requiredStr = match[4];

  // Parse properties
  const properties = {};
  const propRegex = /(\w+):\s*\{\s*type:\s*"([^"]+)"(?:,\s*description:\s*"([^"]+)")?(?:,\s*enum:\s*\[([^\]]+)\])?\s*\}/g;
  let propMatch;
  
  while ((propMatch = propRegex.exec(propertiesStr)) !== null) {
    const propName = propMatch[1];
    const propType = propMatch[2];
    const propDesc = propMatch[3];
    const propEnum = propMatch[4];
    
    properties[propName] = { type: propType };
    if (propDesc) properties[propName].description = propDesc;
    if (propEnum) {
      properties[propName].enum = propEnum.split(',').map(v => v.trim().replace(/['"]/g, ''));
    }
  }

  // Build single-line format
  const propsStr = JSON.stringify(properties).replace(/"/g, "'");
  const requiredArray = requiredStr ? `[${requiredStr.split(',').map(v => v.trim()).join(', ')}]` : undefined;
  
  let singleLine = `{ name: '${name}', description: '${description}', inputSchema: { type: 'object', properties: ${propsStr}`;
  if (requiredArray) {
    singleLine += `, required: ${requiredArray}`;
  }
  singleLine += ' } }';

  // Replace in content
  newContent = newContent.replace(fullMatch, singleLine);
  replacements++;
}

console.log(`Converted ${replacements} Vercel tools to single-line format`);

// Write back
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ File updated successfully');

