#!/usr/bin/env node
/**
 * Validate all tool schemas in thinking-tools-mcp for GPT-5 strict compliance
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsDir = path.join(__dirname, '../packages/thinking-tools-mcp/src/tools');

const violations = [];

function validateSchema(schema, path = '', toolName = '', fileName = '') {
  if (!schema || typeof schema !== 'object') return;

  // Check for nullable: true (INVALID)
  if (schema.nullable === true) {
    violations.push({
      file: fileName,
      tool: toolName,
      path,
      issue: 'nullable: true is invalid in JSON Schema Draft-07',
      fix: 'Use anyOf: [{ type: "X" }, { type: "null" }] instead'
    });
  }

  // Check for type arrays (INVALID)
  if (Array.isArray(schema.type)) {
    violations.push({
      file: fileName,
      tool: toolName,
      path,
      issue: `type array [${schema.type.join(', ')}] is invalid`,
      fix: 'Use oneOf or anyOf with individual type objects'
    });
  }

  // Check for missing additionalProperties: false on objects
  if (schema.type === 'object' && schema.additionalProperties !== false) {
    violations.push({
      file: fileName,
      tool: toolName,
      path,
      issue: 'Object schema missing additionalProperties: false',
      fix: 'Add additionalProperties: false'
    });
  }

  // Recursively check nested properties
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [key, prop] of Object.entries(schema.properties)) {
      validateSchema(prop, `${path}.properties.${key}`, toolName, fileName);
    }
  }

  // Check items (for arrays)
  if (schema.items) {
    validateSchema(schema.items, `${path}.items`, toolName, fileName);
  }

  // Check oneOf/anyOf/allOf
  for (const keyword of ['oneOf', 'anyOf', 'allOf']) {
    if (Array.isArray(schema[keyword])) {
      schema[keyword].forEach((s, i) => {
        validateSchema(s, `${path}.${keyword}[${i}]`, toolName, fileName);
      });
    }
  }
}

// Read all .ts files
const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const content = fs.readFileSync(path.join(toolsDir, file), 'utf8');
  
  // Extract tool descriptors
  const descriptorMatches = content.matchAll(/export const (\w+)\s*=\s*{[\s\S]*?inputSchema:\s*({[\s\S]*?})\s*[,}]/g);
  
  for (const match of descriptorMatches) {
    const toolName = match[1];
    const schemaStr = match[2];
    
    try {
      // Parse the schema (it's JavaScript, not JSON, so we need to eval it carefully)
      const schema = eval(`(${schemaStr})`);
      validateSchema(schema, 'inputSchema', toolName, file);
    } catch (e) {
      violations.push({
        file,
        tool: toolName,
        path: 'inputSchema',
        issue: `Failed to parse schema: ${e.message}`,
        fix: 'Check schema syntax'
      });
    }
  }
}

if (violations.length === 0) {
  console.log('✅ All schemas are GPT-5 compliant!');
  process.exit(0);
} else {
  console.log(`❌ Found ${violations.length} schema violations:\n`);
  for (const v of violations) {
    console.log(`📄 ${v.file} (${v.tool})`);
    console.log(`   Path: ${v.path}`);
    console.log(`   Issue: ${v.issue}`);
    console.log(`   Fix: ${v.fix}\n`);
  }
  process.exit(1);
}

