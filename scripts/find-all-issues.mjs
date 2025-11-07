import fs from 'fs';

const data = JSON.parse(fs.readFileSync('tool-schemas-dump.json', 'utf8'));

console.log('Checking ALL schemas for GPT-5 violations...\n');

const issues = [];

function check(schema, path, toolName, depth = 0) {
  if (!schema || typeof schema !== 'object' || depth > 50) return;
  
  if (schema.type === 'object' && schema.additionalProperties !== false) {
    issues.push({ tool: toolName, path, issue: 'object without additionalProperties: false' });
  }
  
  if (schema.type === 'array' && !schema.items) {
    issues.push({ tool: toolName, path, issue: 'array without items' });
  }
  
  if (schema.nullable) {
    issues.push({ tool: toolName, path, issue: 'has nullable' });
  }
  
  if (Array.isArray(schema.type)) {
    issues.push({ tool: toolName, path, issue: 'type is array' });
  }
  
  if (schema.properties) {
    for (const [k, v] of Object.entries(schema.properties)) {
      check(v, `${path}.properties.${k}`, toolName, depth + 1);
    }
  }
  if (schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
    check(schema.items, `${path}.items`, toolName, depth + 1);
  }
  if (Array.isArray(schema.items)) {
    schema.items.forEach((item, i) => check(item, `${path}.items[${i}]`, toolName, depth + 1));
  }
  ['oneOf', 'anyOf', 'allOf'].forEach(kw => {
    if (Array.isArray(schema[kw])) {
      schema[kw].forEach((s, i) => check(s, `${path}.${kw}[${i}]`, toolName, depth + 1));
    }
  });
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    check(schema.additionalProperties, `${path}.additionalProperties`, toolName, depth + 1);
  }
}

for (const tool of data) {
  check(tool.inputSchema, 'inputSchema', tool.name);
}

if (issues.length === 0) {
  console.log('✅ No issues found\n');
} else {
  console.log(`❌ Found ${issues.length} issues:\n`);
  const byTool = {};
  for (const iss of issues) {
    if (!byTool[iss.tool]) byTool[iss.tool] = [];
    byTool[iss.tool].push(iss);
  }
  for (const [tool, toolIssues] of Object.entries(byTool)) {
    console.log(`\n${tool} (${toolIssues.length}):`);
    for (const iss of toolIssues) {
      console.log(`  ${iss.path}: ${iss.issue}`);
    }
  }
  console.log('');
}

