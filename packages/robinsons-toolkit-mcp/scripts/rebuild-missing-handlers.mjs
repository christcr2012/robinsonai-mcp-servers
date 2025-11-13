#!/usr/bin/env node
/**
 * Rebuild Missing Handlers Script
 * 
 * For each missing/placeholder tool in the audit:
 * 1. Locate the legacy implementation in temp-*.ts files
 * 2. Extract the API call, argument mapping, error handling
 * 3. Generate a proper handler implementation
 * 4. Update the handlers.ts file
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SRC = join(ROOT, 'src');

// Legacy source file mapping
const LEGACY_SOURCES = {
  github: ['src/temp-github-mcp.ts', 'standalone/github-mcp'],
  vercel: ['src/temp-vercel-mcp.ts', 'standalone/vercel-mcp'],
  neon: ['src/temp-neon-mcp.ts'],
  redis: ['src/temp-redis-mcp.ts'],
  openai: ['src/temp-openai-mcp.ts', 'standalone/openai-mcp'],
  admin: ['src/temp-google-workspace-mcp.ts'],
  calendar: ['src/temp-google-workspace-mcp.ts'],
  chat: ['src/temp-google-workspace-mcp.ts'],
  classroom: ['src/temp-google-workspace-mcp.ts'],
  docs: ['src/temp-google-workspace-mcp.ts'],
  drive: ['src/temp-google-workspace-mcp.ts'],
  forms: ['src/temp-google-workspace-mcp.ts'],
  gmail: ['src/temp-google-workspace-mcp.ts'],
  licensing: ['src/temp-google-workspace-mcp.ts'],
  people: ['src/temp-google-workspace-mcp.ts'],
  reports: ['src/temp-google-workspace-mcp.ts'],
  sheets: ['src/temp-google-workspace-mcp.ts'],
  slides: ['src/temp-google-workspace-mcp.ts'],
  tasks: ['src/temp-google-workspace-mcp.ts'],
  fastapi: ['src/fastapi-client.ts'],
  stripe: ['standalone/stripe-mcp'],
  supabase: ['standalone/supabase-mcp'],
  twilio: ['standalone/twilio-mcp'],
  cloudflare: ['standalone/cloudflare-mcp'],
  resend: ['standalone/resend-mcp'],
  n8n: ['standalone/n8n-mcp'],
};

// API documentation URLs
const API_DOCS = {
  github: 'https://docs.github.com/en/rest',
  vercel: 'https://vercel.com/docs/rest-api',
  neon: 'https://api-docs.neon.tech/reference/getting-started-with-neon-api',
  redis: 'https://upstash.com/docs/redis/overall/getstarted',
  openai: 'https://platform.openai.com/docs/api-reference',
  stripe: 'https://stripe.com/docs/api',
  supabase: 'https://supabase.com/docs/reference/javascript/introduction',
  twilio: 'https://www.twilio.com/docs/usage/api',
  cloudflare: 'https://developers.cloudflare.com/api',
  resend: 'https://resend.com/docs/api-reference/introduction',
  n8n: 'https://docs.n8n.io/api',
  admin: 'https://developers.google.com/admin-sdk/directory/reference/rest',
  calendar: 'https://developers.google.com/calendar/api/v3/reference',
  drive: 'https://developers.google.com/drive/api/v3/reference',
  gmail: 'https://developers.google.com/gmail/api/reference/rest',
  sheets: 'https://developers.google.com/sheets/api/reference/rest',
  docs: 'https://developers.google.com/docs/api/reference/rest',
};

console.log('🔧 Rebuilding missing handlers...\n');

// Load audit results
const auditPath = join(DIST, 'placeholder-audit.json');
if (!existsSync(auditPath)) {
  console.error('❌ Audit results not found. Run npm run audit:placeholders first.');
  process.exit(1);
}

const audit = JSON.parse(readFileSync(auditPath, 'utf8'));
const missing = audit.filter(t => t.status === 'missing_handler' || t.status === 'placeholder');

console.log(`📊 Found ${missing.length} tools needing implementation\n`);

// Group by category
const byCategory = {};
missing.forEach(tool => {
  if (!byCategory[tool.categoryId]) {
    byCategory[tool.categoryId] = [];
  }
  byCategory[tool.categoryId].push(tool);
});

console.log('📋 Missing handlers by category:');
Object.entries(byCategory)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([cat, tools]) => {
    console.log(`  ${cat.padEnd(15)} ${tools.length.toString().padStart(4)} tools`);
  });

console.log('\n🔍 Analyzing legacy sources...\n');

// Analyze each category
const analysis = {};
for (const [category, tools] of Object.entries(byCategory)) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Category: ${category} (${tools.length} tools)`);
  console.log('='.repeat(70));
  
  const sources = LEGACY_SOURCES[category] || [];
  const apiDocs = API_DOCS[category];
  
  console.log(`Legacy sources: ${sources.length > 0 ? sources.join(', ') : 'NONE'}`);
  console.log(`API docs: ${apiDocs || 'UNKNOWN'}`);
  
  analysis[category] = {
    tools: tools.map(t => t.toolId),
    count: tools.length,
    legacySources: sources,
    apiDocs,
    status: sources.length > 0 ? 'has_legacy' : 'needs_research',
  };
  
  // Sample first 5 tools
  console.log('\nSample tools:');
  tools.slice(0, 5).forEach(t => {
    console.log(`  - ${t.toolId}`);
  });
}

// Write analysis report
const reportPath = join(DIST, 'missing-handlers-analysis.json');
writeFileSync(reportPath, JSON.stringify(analysis, null, 2));

console.log(`\n\n📄 Analysis report: ${reportPath}`);
console.log('\n✅ Analysis complete!\n');

