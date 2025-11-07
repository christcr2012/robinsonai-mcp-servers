#!/usr/bin/env node
/**
 * Strict JSON Schema validator for GPT-5 compliance
 * Loads compiled tools and validates each schema
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.join(__dirname, '../packages/thinking-tools-mcp');

// Start the MCP server and capture tool definitions
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

// Wait a bit then send list_tools
setTimeout(() => {
  const listMsg = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  });
  proc.stdin.write(listMsg + '\n');
}, 500);

// Collect responses
setTimeout(() => {
  proc.kill();
  
  // Parse responses
  const lines = stdout.split('\n').filter(l => l.trim());
  const responses = lines.map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
  
  const toolsResp = responses.find(r => r.id === 2);
  if (!toolsResp || !toolsResp.result || !toolsResp.result.tools) {
    console.error('❌ Failed to get tools list');
    console.error('Responses:', responses);
    process.exit(1);
  }
  
  const tools = toolsResp.result.tools;
  const violations = [];
  
  function validateSchema(schema, path = '', toolName = '') {
    if (!schema || typeof schema !== 'object') return;
    
    // Check for nullable
    if (schema.nullable === true) {
      violations.push({ tool: toolName, path, issue: 'nullable: true' });
    }
    
    // Check for type arrays
    if (Array.isArray(schema.type)) {
      violations.push({ tool: toolName, path, issue: `type array: [${schema.type.join(',')}]` });
    }
    
    // Check for missing additionalProperties on objects
    if (schema.type === 'object' && schema.additionalProperties !== false) {
      violations.push({ tool: toolName, path, issue: 'object missing additionalProperties: false' });
    }
    
    // Recurse into properties
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [key, prop] of Object.entries(schema.properties)) {
        validateSchema(prop, `${path}.properties.${key}`, toolName);
      }
    }
    
    // Recurse into items
    if (schema.items) {
      validateSchema(schema.items, `${path}.items`, toolName);
    }
    
    // Recurse into oneOf/anyOf/allOf
    for (const keyword of ['oneOf', 'anyOf', 'allOf']) {
      if (Array.isArray(schema[keyword])) {
        schema[keyword].forEach((s, i) => {
          validateSchema(s, `${path}.${keyword}[${i}]`, toolName);
        });
      }
    }
  }
  
  for (const tool of tools) {
    validateSchema(tool.inputSchema, 'inputSchema', tool.name);
  }
  
  if (violations.length === 0) {
    console.log(`✅ All ${tools.length} tools have valid schemas!`);
    process.exit(0);
  } else {
    console.log(`❌ Found ${violations.length} schema violations:\n`);
    for (const v of violations) {
      console.log(`  ${v.tool} @ ${v.path}`);
      console.log(`    Issue: ${v.issue}\n`);
    }
    process.exit(1);
  }
}, 2000);

proc.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

