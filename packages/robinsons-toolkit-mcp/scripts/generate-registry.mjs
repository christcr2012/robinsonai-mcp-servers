#!/usr/bin/env node
/**
 * Registry Generator for Robinson's Toolkit
 * 
 * Scans all *-tools.ts files, validates, deduplicates, and generates:
 * - dist/registry.json (full tool list with schemas and handler paths)
 * - dist/categories.json (category counts and metadata)
 * 
 * Run after build: npm run build
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

// Inline validateTools to avoid importing from src during build
const NAME_RE = /^[A-Za-z0-9:_-]{1,64}$/;

function validateTools(tools) {
  if (!Array.isArray(tools)) return [];
  const seen = new Set();
  const ok = [];
  for (const t of tools) {
    if (!t || typeof t !== "object") continue;
    const name = String(t.name || "").trim();
    if (!NAME_RE.test(name)) continue;
    let inputSchema = t.inputSchema ?? {};
    if (inputSchema === null || typeof inputSchema !== "object") inputSchema = {};
    if (seen.has(name)) continue;
    seen.add(name);
    ok.push({ ...t, name, inputSchema });
  }
  ok.sort((a, b) => a.name.localeCompare(b.name));
  return ok;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

// Use DIST for imports since TypeScript has already compiled
const IMPORT_DIR = DIST;

// Category metadata (matches tool-registry.ts)
const CATEGORY_METADATA = {
  github: { displayName: 'GitHub', description: 'GitHub repository, issue, PR, workflow, and collaboration tools' },
  vercel: { displayName: 'Vercel', description: 'Vercel deployment, project, domain, and serverless platform tools' },
  neon: { displayName: 'Neon', description: 'Neon serverless Postgres database management tools' },
  upstash: { displayName: 'Upstash Redis', description: 'Upstash Redis database operations and management tools' },
  google: { displayName: 'Google Workspace', description: 'Gmail, Drive, Calendar, Sheets, Docs, and other Google Workspace tools' },
  openai: { displayName: 'OpenAI', description: 'OpenAI API tools for chat, embeddings, images, audio, assistants, fine-tuning, and more' },
  stripe: { displayName: 'Stripe', description: 'Stripe payment processing, subscriptions, invoices, and billing tools' },
  supabase: { displayName: 'Supabase', description: 'Supabase database, authentication, storage, and edge functions tools' },
  playwright: { displayName: 'Playwright', description: 'Playwright browser automation and web scraping tools' },
  twilio: { displayName: 'Twilio', description: 'Twilio SMS, voice, video, and messaging tools' },
  resend: { displayName: 'Resend', description: 'Resend email delivery and management tools' },
  cloudflare: { displayName: 'Cloudflare', description: 'Cloudflare DNS, CDN, Workers, and security tools' },
  context7: { displayName: 'Context7', description: 'Context7 documentation and API reference tools' },
  postgres: { displayName: 'PostgreSQL', description: 'PostgreSQL database with pgvector for semantic search and embeddings' },
  neo4j: { displayName: 'Neo4j', description: 'Neo4j graph database for knowledge graphs and relationships' },
  qdrant: { displayName: 'Qdrant', description: 'Qdrant vector database for semantic search and similarity' },
  n8n: { displayName: 'N8N', description: 'N8N workflow automation and integration tools' },
  langchain: { displayName: 'LangChain', description: 'LangChain AI orchestration and RAG tools' },
  gateway: { displayName: 'Gateway', description: 'API gateway and proxy tools' },
  health: { displayName: 'Health', description: 'Health check and monitoring tools' },
};

// Map tool file names to categories and handler modules
// Only include the main combined files, skip the -2, -3, etc. parts
const TOOL_FILE_MAPPING = {
  'stripe-tools.ts': { category: 'stripe', handlerModule: './stripe-handlers.js', exportName: 'STRIPE_TOOLS' },
  'supabase-tools.ts': { category: 'supabase', handlerModule: './supabase-handlers.js', exportName: 'SUPABASE_TOOLS' },
  'playwright-tools.ts': { category: 'playwright', handlerModule: './playwright-handlers.js', exportName: 'PLAYWRIGHT_TOOLS' },
  'twilio-tools.ts': { category: 'twilio', handlerModule: './twilio-handlers.js', exportName: 'TWILIO_TOOLS' },
  'resend-tools.ts': { category: 'resend', handlerModule: './resend-handlers.js', exportName: 'RESEND_TOOLS' },
  'context7-tools.ts': { category: 'context7', handlerModule: './context7-handlers.js', exportName: 'CONTEXT7_TOOLS' },
  'cloudflare-tools.ts': { category: 'cloudflare', handlerModule: './cloudflare-handlers.js', exportName: 'CLOUDFLARE_TOOLS' },
  'postgres-tools.ts': { category: 'postgres', handlerModule: './chris-infrastructure/postgres-handlers.js', exportName: 'postgresTools' },
  'neo4j-tools.ts': { category: 'neo4j', handlerModule: './chris-infrastructure/neo4j-handlers.js', exportName: 'neo4jTools' },
  'qdrant-tools.ts': { category: 'qdrant', handlerModule: './chris-infrastructure/qdrant-handlers.js', exportName: 'qdrantTools' },
  'n8n-tools.ts': { category: 'n8n', handlerModule: './chris-infrastructure/n8n-handlers.js', exportName: 'n8nTools' },
  'langchain-tools.ts': { category: 'langchain', handlerModule: './chris-infrastructure/langchain-handlers.js', exportName: 'langchainTools' },
  'gateway-tools.ts': { category: 'gateway', handlerModule: './chris-infrastructure/gateway-handlers.js', exportName: 'gatewayTools' },
  'health-tools.ts': { category: 'health', handlerModule: './chris-infrastructure/health-handlers.js', exportName: 'healthTools' },
};

// Skip these files - they're parts that get combined into the main files
const SKIP_FILES = new Set([
  'supabase-tools-2.ts',
  'cloudflare-tools-2.ts',
  'cloudflare-tools-3.ts',
  'cloudflare-tools-4.ts',
  'cloudflare-tools-5.ts',
  'twilio-tools-2.ts',
  'resend-tools-2.ts',
  'stripe-handlers-2.ts',
  'stripe-handlers-3.ts',
]);

/**
 * Find all *-tools.ts files recursively
 */
function findToolFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
      findToolFiles(fullPath, files);
    } else if (entry.endsWith('-tools.ts') && entry !== 'broker-tools.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extract category from tool name (e.g., "stripe_customer_create" → "stripe")
 */
function extractCategory(toolName) {
  const match = toolName.match(/^([a-z0-9]+)_/);
  return match ? match[1] : null;
}

/**
 * Extract subcategory from tool name if present (e.g., "gmail_send_message" → "gmail")
 */
function extractSubcategory(toolName) {
  // For Google Workspace tools: gmail_, drive_, calendar_, etc.
  if (toolName.startsWith('gmail_')) return 'gmail';
  if (toolName.startsWith('drive_')) return 'drive';
  if (toolName.startsWith('calendar_')) return 'calendar';
  if (toolName.startsWith('sheets_')) return 'sheets';
  if (toolName.startsWith('docs_')) return 'docs';
  if (toolName.startsWith('slides_')) return 'slides';
  if (toolName.startsWith('forms_')) return 'forms';
  if (toolName.startsWith('admin_')) return 'admin';
  return null;
}

console.log('📦 Loading tools from dist/all-tools.js...');

// Import the all-tools.js which has all tool arrays exported
const allToolsPath = join(DIST, 'all-tools.js');
const allToolsModule = await import(`file:///${allToolsPath.replace(/\\/g, '/')}`);

const allTools = [];
const categoryCounts = new Map();
const subcategoriesMap = new Map();

// Process each tool category from the mapping
for (const [fileName, mapping] of Object.entries(TOOL_FILE_MAPPING)) {
  console.log(`📦 Processing ${fileName} (category: ${mapping.category})`);

  try {
    const exportName = mapping.exportName;
    const tools = allToolsModule[exportName];

    if (!tools) {
      console.warn(`⚠️  Export ${exportName} not found in all-tools.js, skipping ${fileName}`);
      continue;
    }
    
    if (!Array.isArray(tools)) {
      console.warn(`⚠️  ${exportName} is not an array in ${fileName}`);
      continue;
    }
    
    // Validate and add category/handler info
    const validated = validateTools(tools);
    for (const tool of validated) {
      const category = extractCategory(tool.name) || mapping.category;
      const subcategory = extractSubcategory(tool.name);
      
      allTools.push({
        ...tool,
        category,
        subcategory: subcategory || undefined,
        handler: mapping.handlerModule,
      });
      
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      
      if (subcategory) {
        if (!subcategoriesMap.has(category)) {
          subcategoriesMap.set(category, new Set());
        }
        subcategoriesMap.get(category).add(subcategory);
      }
    }
    
    console.log(`  ✅ Added ${validated.length} tools`);
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error);
  }
}

console.log(`\n📊 Total tools: ${allTools.length}`);
console.log(`📊 Categories: ${categoryCounts.size}`);

// Generate categories.json
const categories = {};
for (const [category, count] of categoryCounts.entries()) {
  const metadata = CATEGORY_METADATA[category] || {
    displayName: category.charAt(0).toUpperCase() + category.slice(1),
    description: `${category} tools`,
  };
  
  const subcategories = subcategoriesMap.get(category);
  
  categories[category] = {
    name: category,
    ...metadata,
    toolCount: count,
    subcategories: subcategories ? Array.from(subcategories).sort() : undefined,
  };
}

// Write registry.json
writeFileSync(join(DIST, 'registry.json'), JSON.stringify(allTools, null, 2));
console.log(`✅ Wrote dist/registry.json (${allTools.length} tools)`);

// Write categories.json
writeFileSync(join(DIST, 'categories.json'), JSON.stringify(categories, null, 2));
console.log(`✅ Wrote dist/categories.json (${Object.keys(categories).length} categories)`);

console.log('\n✨ Registry generation complete!');

