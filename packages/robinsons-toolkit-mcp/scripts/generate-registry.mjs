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
  // Main integrations
  github: { id: 'github', displayName: 'GitHub', description: 'GitHub repository, issue, PR, workflow, and collaboration tools' },
  vercel: { id: 'vercel', displayName: 'Vercel', description: 'Vercel deployment, project, domain, and serverless platform tools' },
  neon: { id: 'neon', displayName: 'Neon', description: 'Neon serverless Postgres database management tools' },
  upstash: { id: 'upstash', displayName: 'Upstash Redis', description: 'Upstash Redis database operations and management tools' },
  redis: { id: 'redis', displayName: 'Redis', description: 'Redis database operations via Upstash (alias for upstash category)' },
  google: { id: 'google', displayName: 'Google Workspace', description: 'Gmail, Drive, Calendar, Sheets, Docs, and other Google Workspace tools' },
  openai: { id: 'openai', displayName: 'OpenAI', description: 'OpenAI API tools for chat, embeddings, images, audio, assistants, fine-tuning, and more' },
  stripe: { id: 'stripe', displayName: 'Stripe', description: 'Stripe payment processing, subscriptions, invoices, and billing tools' },
  supabase: { id: 'supabase', displayName: 'Supabase', description: 'Supabase database, authentication, storage, and edge functions tools' },
  playwright: { id: 'playwright', displayName: 'Playwright', description: 'Playwright browser automation and web scraping tools' },
  twilio: { id: 'twilio', displayName: 'Twilio', description: 'Twilio SMS, voice, video, and messaging tools' },
  resend: { id: 'resend', displayName: 'Resend', description: 'Resend email delivery and management tools' },
  cloudflare: { id: 'cloudflare', displayName: 'Cloudflare', description: 'Cloudflare DNS, CDN, Workers, and security tools' },
  context7: { id: 'context7', displayName: 'Context7', description: 'Context7 documentation and API reference tools' },
  postgres: { id: 'postgres', displayName: 'PostgreSQL', description: 'PostgreSQL database with pgvector for semantic search and embeddings' },
  neo4j: { id: 'neo4j', displayName: 'Neo4j', description: 'Neo4j graph database for knowledge graphs and relationships' },
  qdrant: { id: 'qdrant', displayName: 'Qdrant', description: 'Qdrant vector database for semantic search and similarity' },
  n8n: { id: 'n8n', displayName: 'N8N', description: 'N8N workflow automation and integration tools' },
  langchain: { id: 'langchain', displayName: 'LangChain', description: 'LangChain AI orchestration and RAG tools' },
  gateway: { id: 'gateway', displayName: 'Gateway', description: 'API gateway and proxy tools for N8N, Crawl4AI, SearXNG, and other services' },
  fastapi: { id: 'fastapi', displayName: 'FastAPI', description: 'FastAPI gateway tools (alias for gateway category)' },
  health: { id: 'health', displayName: 'Health', description: 'Health check and monitoring tools' },
  rad: { id: 'rad', displayName: 'RAD (Repository Agent Database)', description: 'RAD source and crawl management tools for document indexing' },

  // Google Workspace subcategories
  admin: { id: 'admin', displayName: 'Google Admin', description: 'Google Workspace admin console tools for user, group, device, and organization management' },
  calendar: { id: 'calendar', displayName: 'Google Calendar', description: 'Google Calendar tools for event creation, scheduling, and calendar management' },
  chat: { id: 'chat', displayName: 'Google Chat', description: 'Google Chat tools for messaging, spaces, and team collaboration' },
  classroom: { id: 'classroom', displayName: 'Google Classroom', description: 'Google Classroom tools for course, assignment, and student management' },
  docs: { id: 'docs', displayName: 'Google Docs', description: 'Google Docs tools for document creation, editing, and collaboration' },
  drive: { id: 'drive', displayName: 'Google Drive', description: 'Google Drive tools for file storage, sharing, and management' },
  forms: { id: 'forms', displayName: 'Google Forms', description: 'Google Forms tools for survey and form creation and response management' },
  gmail: { id: 'gmail', displayName: 'Gmail', description: 'Gmail tools for email sending, reading, searching, and management' },
  licensing: { id: 'licensing', displayName: 'Google Licensing', description: 'Google Workspace licensing tools for subscription and license management' },
  people: { id: 'people', displayName: 'Google People', description: 'Google People API tools for contact and profile management' },
  reports: { id: 'reports', displayName: 'Google Reports', description: 'Google Workspace reports and analytics tools for usage and activity tracking' },
  sheets: { id: 'sheets', displayName: 'Google Sheets', description: 'Google Sheets tools for spreadsheet creation, editing, and data management' },
  slides: { id: 'slides', displayName: 'Google Slides', description: 'Google Slides tools for presentation creation and editing' },
  tasks: { id: 'tasks', displayName: 'Google Tasks', description: 'Google Tasks tools for task and to-do list management' },
};

// Map tool file names to categories and handler modules
// Now using organized category folder structure
const TOOL_FILE_MAPPING = {
  'categories/openai/tools.ts': { category: 'openai', handlerModule: './categories/openai/handlers.js', exportName: 'OPENAI_TOOLS' },
  'categories/google/tools.ts': { category: 'google', handlerModule: './categories/google/handlers.js', exportName: 'GOOGLE_TOOLS' },
  'categories/github/tools.ts': { category: 'github', handlerModule: './categories/github/handlers.js', exportName: 'GITHUB_TOOLS' },
  'categories/vercel/tools.ts': { category: 'vercel', handlerModule: './categories/vercel/handlers.js', exportName: 'VERCEL_TOOLS' },
  'categories/stripe/tools.ts': { category: 'stripe', handlerModule: './categories/stripe/handlers.js', exportName: 'STRIPE_TOOLS' },
  'categories/supabase/tools.ts': { category: 'supabase', handlerModule: './categories/supabase/handlers.js', exportName: 'SUPABASE_TOOLS' },
  'categories/playwright/tools.ts': { category: 'playwright', handlerModule: './categories/playwright/handlers.js', exportName: 'PLAYWRIGHT_TOOLS' },
  'categories/twilio/tools.ts': { category: 'twilio', handlerModule: './categories/twilio/handlers.js', exportName: 'TWILIO_TOOLS' },
  'categories/resend/tools.ts': { category: 'resend', handlerModule: './categories/resend/handlers.js', exportName: 'RESEND_TOOLS' },
  'categories/context7/tools.ts': { category: 'context7', handlerModule: './categories/context7/handlers.js', exportName: 'CONTEXT7_TOOLS' },
  'categories/cloudflare/tools.ts': { category: 'cloudflare', handlerModule: './categories/cloudflare/handlers.js', exportName: 'CLOUDFLARE_TOOLS' },
  'categories/postgres/tools.ts': { category: 'postgres', handlerModule: './categories/postgres/handlers.js', exportName: 'postgresTools' },
  'categories/neo4j/tools.ts': { category: 'neo4j', handlerModule: './categories/neo4j/handlers.js', exportName: 'neo4jTools' },
  'categories/qdrant/tools.ts': { category: 'qdrant', handlerModule: './categories/qdrant/handlers.js', exportName: 'qdrantTools' },
  'categories/n8n/tools.ts': { category: 'n8n', handlerModule: './categories/n8n/handlers.js', exportName: 'n8nTools' },
  'categories/langchain/tools.ts': { category: 'langchain', handlerModule: './categories/langchain/handlers.js', exportName: 'langchainTools' },
  'categories/gateway/tools.ts': { category: 'gateway', handlerModule: './categories/gateway/handlers.js', exportName: 'gatewayTools' },
  'categories/health/tools.ts': { category: 'health', handlerModule: './categories/health/handlers.js', exportName: 'healthTools' },
  'categories/neon/tools.ts': { category: 'neon', handlerModule: './categories/neon/handlers.js', exportName: 'NEON_TOOLS' },
  'categories/rad/tools.ts': { category: 'rad', handlerModule: './categories/rad/handlers.js', exportName: 'RAD_TOOLS' },
  'categories/upstash/tools.ts': { category: 'upstash', handlerModule: './categories/upstash/handlers.js', exportName: 'UPSTASH_TOOLS' },
};

// Skip these files - they're parts that get combined into the main files
const SKIP_FILES = new Set([
  'categories/supabase/tools-2.ts',
  'categories/cloudflare/tools-2.ts',
  'categories/cloudflare/tools-3.ts',
  'categories/cloudflare/tools-4.ts',
  'categories/cloudflare/tools-5.ts',
  'categories/twilio/tools-2.ts',
  'categories/stripe/handlers-2.ts',
  'categories/stripe/handlers-3.ts',
  'categories/supabase/handlers-2.ts',
  'categories/resend/handlers-2.ts',
  'categories/twilio/handlers-2.ts',
  'categories/twilio/handlers-3.ts',
  'categories/cloudflare/handlers-2.ts',
  'categories/cloudflare/handlers-3.ts',
  'categories/cloudflare/handlers-4.ts',
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
  if (toolName.startsWith('chat_')) return 'chat';
  if (toolName.startsWith('classroom_')) return 'classroom';
  if (toolName.startsWith('licensing_')) return 'licensing';
  if (toolName.startsWith('people_')) return 'people';
  if (toolName.startsWith('reports_')) return 'reports';
  if (toolName.startsWith('tasks_')) return 'tasks';
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

