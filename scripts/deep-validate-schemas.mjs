#!/usr/bin/env node
/**
 * COMPREHENSIVE JSON Schema audit for GPT-5 strict mode
 * Finds ALL issues in ALL schemas before publishing
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.join(__dirname, '../packages/thinking-tools-mcp');

// Start the MCP server
const proc = spawn('node', ['dist/index.js'], {
  cwd: pkgDir,
  stdio: ['pipe', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

proc.stdout.on('data', (data) => {
  stdout += data.toString();
});

proc.stderr.on('data', (data) => {
  stderr += data.toString();
});

// Send initialize request
const initMsg = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'validator', version: '1.0' }
  }
});

proc.stdin.write(initMsg + '\n');

// Wait then send list_tools
setTimeout(() => {
  const listMsg = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  });
  proc.stdin.write(listMsg + '\n');
}, 500);

// Collect and validate
setTimeout(() => {
  proc.kill();
  
  const lines = stdout.split('\n').filter(l => l.trim());
  const responses = lines.map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
  
  const toolsResp = responses.find(r => r.id === 2);
  if (!toolsResp || !toolsResp.result || !toolsResp.result.tools) {
    console.error('❌ Failed to get tools list');
    console.error('stdout:', stdout);
    console.error('stderr:', stderr);
    process.exit(1);
  }
  
  const tools = toolsResp.result.tools;
  
  // Save full tool definitions for inspection
  fs.writeFileSync('tool-schemas-dump.json', JSON.stringify(tools, null, 2));
  console.log(`📝 Saved ${tools.length} tool schemas to tool-schemas-dump.json\n`);
  
  const violations = [];
  
  /**
   * Recursively validate schema against GPT-5 strict rules
   */
  function validateSchema(schema, path = '', toolName = '', depth = 0) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      return;
    }
    
    if (depth > 20) {
      violations.push({ tool: toolName, path, issue: 'Schema too deeply nested (>20 levels)' });
      return;
    }
    
    // Rule 1: No nullable keyword
    if (schema.nullable === true) {
      violations.push({ 
        tool: toolName, 
        path, 
        issue: 'INVALID: nullable: true (use anyOf with null type instead)',
        schema: JSON.stringify(schema).substring(0, 200)
      });
    }
    
    // Rule 2: No type arrays
    if (Array.isArray(schema.type)) {
      violations.push({ 
        tool: toolName, 
        path, 
        issue: `INVALID: type array [${schema.type.join(', ')}] (use oneOf/anyOf instead)`,
        schema: JSON.stringify(schema).substring(0, 200)
      });
    }
    
    // Rule 3: All objects MUST have additionalProperties: false
    if (schema.type === 'object') {
      if (schema.additionalProperties !== false) {
        violations.push({ 
          tool: toolName, 
          path, 
          issue: 'INVALID: object without additionalProperties: false',
          schema: JSON.stringify(schema).substring(0, 200)
        });
      }
    }
    
    // Rule 4: Check for invalid keywords
    const invalidKeywords = ['$schema', 'id', '$id', 'definitions', '$defs'];
    for (const keyword of invalidKeywords) {
      if (schema[keyword]) {
        violations.push({
          tool: toolName,
          path,
          issue: `INVALID: contains ${keyword} (not allowed in MCP tool schemas)`,
          schema: JSON.stringify(schema).substring(0, 200)
        });
      }
    }
    
    // Recurse into properties
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [key, prop] of Object.entries(schema.properties)) {
        validateSchema(prop, `${path}.properties.${key}`, toolName, depth + 1);
      }
    }
    
    // Recurse into items (array items)
    if (schema.items) {
      if (Array.isArray(schema.items)) {
        schema.items.forEach((item, i) => {
          validateSchema(item, `${path}.items[${i}]`, toolName, depth + 1);
        });
      } else {
        validateSchema(schema.items, `${path}.items`, toolName, depth + 1);
      }
    }
    
    // Recurse into oneOf/anyOf/allOf
    for (const keyword of ['oneOf', 'anyOf', 'allOf']) {
      if (Array.isArray(schema[keyword])) {
        schema[keyword].forEach((s, i) => {
          validateSchema(s, `${path}.${keyword}[${i}]`, toolName, depth + 1);
        });
      }
    }
    
    // Recurse into not
    if (schema.not) {
      validateSchema(schema.not, `${path}.not`, toolName, depth + 1);
    }
    
    // Recurse into patternProperties
    if (schema.patternProperties && typeof schema.patternProperties === 'object') {
      for (const [pattern, prop] of Object.entries(schema.patternProperties)) {
        validateSchema(prop, `${path}.patternProperties["${pattern}"]`, toolName, depth + 1);
      }
    }
    
    // Recurse into additionalProperties if it's a schema
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      validateSchema(schema.additionalProperties, `${path}.additionalProperties`, toolName, depth + 1);
    }
  }
  
  // Validate each tool
  for (const tool of tools) {
    if (!tool.inputSchema) {
      violations.push({ 
        tool: tool.name, 
        path: 'inputSchema', 
        issue: 'MISSING: No inputSchema defined' 
      });
      continue;
    }
    
    validateSchema(tool.inputSchema, 'inputSchema', tool.name, 0);
  }
  
  // Report results
  if (violations.length === 0) {
    console.log(`✅ All ${tools.length} tools have VALID schemas!\n`);
    process.exit(0);
  } else {
    console.log(`❌ Found ${violations.length} schema violations:\n`);
    
    // Group by tool
    const byTool = {};
    for (const v of violations) {
      if (!byTool[v.tool]) byTool[v.tool] = [];
      byTool[v.tool].push(v);
    }
    
    for (const [toolName, issues] of Object.entries(byTool)) {
      console.log(`\n🔴 ${toolName} (${issues.length} issues):`);
      for (const issue of issues) {
        console.log(`   Path: ${issue.path}`);
        console.log(`   Issue: ${issue.issue}`);
        if (issue.schema) {
          console.log(`   Schema: ${issue.schema}`);
        }
        console.log('');
      }
    }
    
    console.log(`\n📝 Full tool schemas saved to tool-schemas-dump.json for inspection\n`);
    process.exit(1);
  }
}, 2000);

proc.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

