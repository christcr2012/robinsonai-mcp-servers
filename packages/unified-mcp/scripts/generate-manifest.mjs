#!/usr/bin/env node

/**
 * Static Manifest Generator
 * 
 * Introspects all MCP server packages and generates a static tools.manifest.json
 * This makes list_tools instant (10ms) instead of slow (100ms+)
 * 
 * Usage: node scripts/generate-manifest.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Packages to scan (in monorepo)
const PACKAGES = [
  'github-mcp',
  'vercel-mcp',
  'neon-mcp',
  'google-workspace-mcp',
  'resend-mcp',
  'twilio-mcp',
  'cloudflare-mcp',
  'redis-mcp',
  'openai-mcp',
  'playwright-mcp',
  'sequential-thinking-mcp',
  'context7-mcp',
];

// Namespace mapping (package name -> tool prefix)
const NAMESPACE_MAP = {
  'github-mcp': 'github',
  'vercel-mcp': 'vercel',
  'neon-mcp': 'neon',
  'google-workspace-mcp': 'google', // Will have gmail_, drive_, etc.
  'resend-mcp': 'resend',
  'twilio-mcp': 'twilio',
  'cloudflare-mcp': 'cloudflare',
  'redis-mcp': 'redis',
  'openai-mcp': 'openai',
  'playwright-mcp': 'playwright',
  'sequential-thinking-mcp': 'thinking',
  'context7-mcp': 'context7',
};

/**
 * Extract tools from a package's built index.js
 */
function extractToolsFromPackage(packageName) {
  const packagePath = path.join(__dirname, '../../', packageName);
  const distPath = path.join(packagePath, 'dist/index.js');
  
  if (!fs.existsSync(distPath)) {
    console.warn(`⚠️  ${packageName}: dist/index.js not found (run build first)`);
    return [];
  }

  try {
    // Read the built JS file
    const content = fs.readFileSync(distPath, 'utf-8');
    
    // Extract tools array from the code
    // Look for patterns like: { name: 'tool_name', description: '...', inputSchema: {...} }
    const tools = [];
    
    // Simple regex-based extraction (works for most MCP servers)
    // Match tool definitions in the format: { name: 'xxx', description: 'yyy', inputSchema: {...} }
    const toolRegex = /{\s*name:\s*['"]([^'"]+)['"]\s*,\s*description:\s*['"]([^'"]+)['"]\s*,\s*inputSchema:\s*({[\s\S]*?})\s*}/g;
    
    let match;
    while ((match = toolRegex.exec(content)) !== null) {
      const [, name, description, inputSchemaStr] = match;
      
      try {
        // Try to parse the inputSchema (it's embedded JS object, not JSON)
        // For now, just store it as a string and we'll handle it later
        tools.push({
          name,
          description,
          inputSchema: inputSchemaStr, // Will be parsed later
          namespace: NAMESPACE_MAP[packageName] || packageName.replace('-mcp', ''),
          source: packageName,
        });
      } catch (e) {
        console.warn(`⚠️  ${packageName}: Failed to parse tool ${name}`);
      }
    }
    
    return tools;
  } catch (error) {
    console.error(`❌ ${packageName}: Error reading dist/index.js:`, error.message);
    return [];
  }
}

/**
 * Manually define tools for packages that don't follow standard patterns
 */
function getManualToolDefinitions() {
  return {
    'sequential-thinking-mcp': [
      {
        name: 'sequential_thinking',
        description: 'Record a step in sequential reasoning process',
        inputSchema: {
          type: 'object',
          properties: {
            thoughtNumber: { type: 'number' },
            totalThoughts: { type: 'number' },
            thought: { type: 'string' },
            nextThoughtNeeded: { type: 'boolean' },
          },
          required: ['thoughtNumber', 'totalThoughts', 'thought', 'nextThoughtNeeded'],
        },
        namespace: 'thinking',
        source: 'sequential-thinking-mcp',
      },
      {
        name: 'parallel_thinking',
        description: 'Explore multiple reasoning branches in parallel',
        inputSchema: {
          type: 'object',
          properties: {
            branchId: { type: 'string' },
            description: { type: 'string' },
            thoughtNumber: { type: 'number' },
            thought: { type: 'string' },
            nextThoughtNeeded: { type: 'boolean' },
            conclusion: { type: 'string' },
          },
          required: ['branchId', 'thoughtNumber', 'thought', 'nextThoughtNeeded'],
        },
        namespace: 'thinking',
        source: 'sequential-thinking-mcp',
      },
      {
        name: 'reflective_thinking',
        description: 'Reflect on and improve previous thoughts',
        inputSchema: {
          type: 'object',
          properties: {
            thoughtNumber: { type: 'number' },
            reflection: { type: 'string' },
            improvements: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' },
          },
          required: ['thoughtNumber', 'reflection', 'improvements', 'confidence'],
        },
        namespace: 'thinking',
        source: 'sequential-thinking-mcp',
      },
    ],
  };
}

/**
 * Enforce namespacing rules
 */
function enforceNamespacing(tools) {
  const violations = [];
  const fixed = [];

  for (const tool of tools) {
    const expectedPrefix = tool.namespace + '_';
    
    // Special cases that don't need prefixes
    const specialCases = ['sequential_thinking', 'parallel_thinking', 'reflective_thinking'];
    if (specialCases.includes(tool.name)) {
      fixed.push(tool);
      continue;
    }

    // Check if tool name starts with namespace
    if (!tool.name.startsWith(expectedPrefix)) {
      violations.push({
        tool: tool.name,
        expected: expectedPrefix + tool.name,
        source: tool.source,
      });
      
      // Auto-fix: add namespace prefix
      fixed.push({
        ...tool,
        name: expectedPrefix + tool.name,
        originalName: tool.name, // Keep for alias
      });
    } else {
      fixed.push(tool);
    }
  }

  if (violations.length > 0) {
    console.warn(`\n⚠️  Found ${violations.length} namespacing violations (auto-fixed):`);
    violations.slice(0, 10).forEach(v => {
      console.warn(`   ${v.tool} → ${v.expected} (${v.source})`);
    });
    if (violations.length > 10) {
      console.warn(`   ... and ${violations.length - 10} more`);
    }
  }

  return fixed;
}

/**
 * Main generator
 */
async function generateManifest() {
  console.log('🔨 Generating static tools manifest...\n');

  let allTools = [];
  const manualDefs = getManualToolDefinitions();

  // Extract tools from each package
  for (const pkg of PACKAGES) {
    console.log(`📦 Scanning ${pkg}...`);
    
    // Use manual definitions if available
    if (manualDefs[pkg]) {
      allTools.push(...manualDefs[pkg]);
      console.log(`   ✅ ${manualDefs[pkg].length} tools (manual definitions)`);
    } else {
      const tools = extractToolsFromPackage(pkg);
      allTools.push(...tools);
      console.log(`   ${tools.length > 0 ? '✅' : '⚠️ '} ${tools.length} tools`);
    }
  }

  // Enforce namespacing
  console.log('\n🔍 Enforcing namespacing rules...');
  allTools = enforceNamespacing(allTools);

  // Generate manifest
  const manifest = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    totalTools: allTools.length,
    namespaces: [...new Set(allTools.map(t => t.namespace))],
    tools: allTools.map(t => ({
      name: t.name,
      description: t.description,
      namespace: t.namespace,
      source: t.source,
      inputSchema: typeof t.inputSchema === 'string' ? '{}' : t.inputSchema,
      ...(t.originalName && { alias: t.originalName }),
    })),
  };

  // Write manifest to both src and dist
  const srcPath = path.join(__dirname, '../src/tools.manifest.json');
  const distPath = path.join(__dirname, '../dist/tools.manifest.json');

  fs.writeFileSync(srcPath, JSON.stringify(manifest, null, 2));

  // Also write to dist if it exists
  if (fs.existsSync(path.join(__dirname, '../dist'))) {
    fs.writeFileSync(distPath, JSON.stringify(manifest, null, 2));
  }

  console.log(`\n✅ Manifest generated successfully!`);
  console.log(`   📄 ${srcPath}`);
  console.log(`   🔧 ${manifest.totalTools} tools from ${manifest.namespaces.length} namespaces`);
  console.log(`   📦 Namespaces: ${manifest.namespaces.join(', ')}`);

  return manifest;
}

// Run
generateManifest().catch(error => {
  console.error('❌ Failed to generate manifest:', error);
  process.exit(1);
});

