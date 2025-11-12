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
const TOOL_FILE_MAPPING = {
  'stripe-tools.ts': { category: 'stripe', handlerModule: './stripe-handlers.js' },
  'supabase-tools.ts': { category: 'supabase', handlerModule: './supabase-handlers.js' },
  'supabase-tools-2.ts': { category: 'supabase', handlerModule: './supabase-handlers-2.js' },
  'playwright-tools.ts': { category: 'playwright', handlerModule: './playwright-handlers.js' },
  'twilio-tools.ts': { category: 'twilio', handlerModule: './twilio-handlers.js' },
  'twilio-tools-2.ts': { category: 'twilio', handlerModule: './twilio-handlers-2.js' },
  'resend-tools.ts': { category: 'resend', handlerModule: './resend-handlers.js' },
  'context7-tools.ts': { category: 'context7', handlerModule: './context7-handlers.js' },
  'cloudflare-tools.ts': { category: 'cloudflare', handlerModule: './cloudflare-handlers.js' },
  'cloudflare-tools-2.ts': { category: 'cloudflare', handlerModule: './cloudflare-handlers-2.js' },
  'cloudflare-tools-3.ts': { category: 'cloudflare', handlerModule: './cloudflare-handlers-3.js' },
  'cloudflare-tools-4.ts': { category: 'cloudflare', handlerModule: './cloudflare-handlers-4.js' },
  'cloudflare-tools-5.ts': { category: 'cloudflare', handlerModule: './cloudflare-handlers-5.js' },
  'postgres-tools.ts': { category: 'postgres', handlerModule: './chris-infrastructure/postgres-handlers.js' },
  'neo4j-tools.ts': { category: 'neo4j', handlerModule: './chris-infrastructure/neo4j-handlers.js' },
  'qdrant-tools.ts': { category: 'qdrant', handlerModule: './chris-infrastructure/qdrant-handlers.js' },
  'n8n-tools.ts': { category: 'n8n', handlerModule: './chris-infrastructure/n8n-handlers.js' },
  'langchain-tools.ts': { category: 'langchain', handlerModule: './chris-infrastructure/langchain-handlers.js' },
  'gateway-tools.ts': { category: 'gateway', handlerModule: './chris-infrastructure/gateway-handlers.js' },
  'health-tools.ts': { category: 'health', handlerModule: './chris-infrastructure/health-handlers.js' },
};

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

console.log('🔍 Scanning for tool files...');
const toolFiles = findToolFiles(SRC);
console.log(`Found ${toolFiles.length} tool files`);

const allTools = [];
const categoryCounts = new Map();
const subcategoriesMap = new Map();

for (const toolFile of toolFiles) {
  const fileName = toolFile.split(/[/\\]/).pop()!;
  const mapping = TOOL_FILE_MAPPING[fileName];
  
  if (!mapping) {
    console.warn(`⚠️  No mapping for ${fileName}, skipping`);
    continue;
  }

  console.log(`📦 Processing ${fileName} (category: ${mapping.category})`);
  
  try {
    // Read the file and extract the exported array
    const content = readFileSync(toolFile, 'utf-8');
    
    // Find the export statement (e.g., "export const STRIPE_TOOLS = [")
    const exportMatch = content.match(/export\s+const\s+(\w+)\s*=\s*\[/);
    if (!exportMatch) {
      console.warn(`⚠️  No export found in ${fileName}`);
      continue;
    }
    
    // Use dynamic import to load the module
    const relPath = relative(ROOT, toolFile).replace(/\\/g, '/');
    const module = await import(`file:///${join(ROOT, relPath)}`);
    const exportName = exportMatch[1];
    const tools = module[exportName];
    
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
        subcategoriesMap.get(category)!.add(subcategory);
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

