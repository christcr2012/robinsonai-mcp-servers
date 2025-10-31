#!/usr/bin/env node
/**
 * Standardize Vercel tools to single-line compact format
 * Converts from multi-line format to match GitHub/Neon/Upstash style
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../packages/robinsons-toolkit-mcp/src/index.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let newLines = [];
let i = 0;
let replacements = 0;

while (i < lines.length) {
  const line = lines[i];
  
  // Check if this line starts a Vercel tool definition
  if (line.trim().startsWith('name: "vercel_')) {
    // Extract the tool name
    const nameMatch = line.match(/name:\s*"(vercel_[^"]+)"/);
    if (!nameMatch) {
      newLines.push(line);
      i++;
      continue;
    }
    
    const toolName = nameMatch[1];
    
    // Collect all lines for this tool until we find the closing brace
    let toolLines = [line];
    let braceCount = 0;
    let foundStart = false;
    
    // Count braces in first line
    for (const char of line) {
      if (char === '{') { braceCount++; foundStart = true; }
      if (char === '}') braceCount--;
    }
    
    i++;
    
    // Continue collecting lines until braces balance
    while (i < lines.length && (braceCount > 0 || !foundStart)) {
      const currentLine = lines[i];
      toolLines.push(currentLine);
      
      for (const char of currentLine) {
        if (char === '{') { braceCount++; foundStart = true; }
        if (char === '}') braceCount--;
      }
      
      i++;
      
      // Stop if we've closed all braces
      if (foundStart && braceCount === 0) break;
    }
    
    // Parse the tool definition
    const toolText = toolLines.join('\n');
    
    try {
      // Extract description
      const descMatch = toolText.match(/description:\s*"([^"]+)"/);
      const description = descMatch ? descMatch[1] : '';
      
      // Extract properties
      const propsMatch = toolText.match(/properties:\s*\{([\s\S]*?)\n\s*\}(?:,|\s*\n)/);
      let properties = {};
      
      if (propsMatch) {
        const propsText = propsMatch[1];
        
        // Parse each property
        const propLines = propsText.split('\n').filter(l => l.trim());
        let currentProp = null;
        let currentPropObj = {};
        
        for (const propLine of propLines) {
          const propNameMatch = propLine.match(/^\s*(\w+):\s*\{/);
          if (propNameMatch) {
            // Save previous property
            if (currentProp) {
              properties[currentProp] = currentPropObj;
            }
            
            // Start new property
            currentProp = propNameMatch[1];
            currentPropObj = {};
            
            // Check if it's a one-liner
            const oneLineMatch = propLine.match(/^\s*(\w+):\s*\{\s*type:\s*"([^"]+)"(?:,\s*description:\s*"([^"]+)")?\s*\}/);
            if (oneLineMatch) {
              currentPropObj.type = oneLineMatch[2];
              if (oneLineMatch[3]) currentPropObj.description = oneLineMatch[3];
              properties[currentProp] = currentPropObj;
              currentProp = null;
              currentPropObj = {};
            }
          } else if (currentProp) {
            // Parse property attributes
            const typeMatch = propLine.match(/type:\s*"([^"]+)"/);
            const descMatch = propLine.match(/description:\s*"([^"]+)"/);
            const enumMatch = propLine.match(/enum:\s*\[([^\]]+)\]/);
            
            if (typeMatch) currentPropObj.type = typeMatch[1];
            if (descMatch) currentPropObj.description = descMatch[1];
            if (enumMatch) {
              currentPropObj.enum = enumMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
            }
            
            // Check for nested object
            if (propLine.includes('properties:')) {
              currentPropObj.type = 'object';
            }
          }
        }
        
        // Save last property
        if (currentProp) {
          properties[currentProp] = currentPropObj;
        }
      }
      
      // Extract required array
      const requiredMatch = toolText.match(/required:\s*\[([^\]]+)\]/);
      const required = requiredMatch ? requiredMatch[1].split(',').map(v => v.trim()) : null;
      
      // Build single-line format
      const propsStr = JSON.stringify(properties).replace(/"/g, "'");
      let singleLine = `        { name: '${toolName}', description: '${description}', inputSchema: { type: 'object', properties: ${propsStr}`;
      
      if (required) {
        singleLine += `, required: [${required.join(', ')}]`;
      }
      
      singleLine += ' } },';
      
      newLines.push(singleLine);
      replacements++;
      
      console.log(`✓ Converted ${toolName}`);
      
    } catch (error) {
      console.error(`✗ Failed to convert ${toolName}:`, error.message);
      // Keep original lines if conversion fails
      newLines.push(...toolLines);
    }
    
  } else {
    newLines.push(line);
    i++;
  }
}

console.log(`\nConverted ${replacements} Vercel tools to single-line format`);

// Write back
fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('✅ File updated successfully');

