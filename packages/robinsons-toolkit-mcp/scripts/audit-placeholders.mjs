#!/usr/bin/env node
/**
 * Placeholder / Parity Audit Script
 * 
 * Checks all tools in the registry to ensure they have real implementations,
 * not placeholders or stubs.
 * 
 * Detects:
 * - Missing handler functions
 * - "Not implemented" errors
 * - TODO/stub comments
 * - Fake/dummy responses
 * - Empty implementations
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SRC = join(ROOT, 'src');

console.log('🔍 Starting placeholder audit...\n');

// Load registry
const registryPath = join(DIST, 'registry.json');
if (!existsSync(registryPath)) {
  console.error('❌ Registry not found. Run npm run build first.');
  process.exit(1);
}

const tools = JSON.parse(readFileSync(registryPath, 'utf8'));
console.log(`📊 Loaded ${tools.length} tools from registry\n`);

// Detect naming conventions per category
console.log('🔍 Detecting naming conventions per category...\n');
const categoryConventions = await detectCategoryConventions(tools);

// Audit results
const results = [];
let okCount = 0;
let missingCount = 0;
let placeholderCount = 0;

// Process each tool
for (const tool of tools) {
  const convention = categoryConventions[tool.category];
  const result = await auditTool(tool, convention);
  results.push(result);

  if (result.status === 'ok') okCount++;
  else if (result.status === 'missing_handler') missingCount++;
  else if (result.status === 'placeholder') placeholderCount++;
}

// Write audit report
const reportPath = join(DIST, 'placeholder-audit.json');
writeFileSync(reportPath, JSON.stringify(results, null, 2));

// Count naming issues
const namingIssues = results.filter(r => r.namingIssue).length;

// Print summary
console.log('\n' + '='.repeat(60));
console.log('📊 AUDIT SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tools:        ${tools.length}`);
console.log(`✅ OK:              ${okCount} (${((okCount/tools.length)*100).toFixed(1)}%)`);
console.log(`❌ Missing Handler: ${missingCount} (${((missingCount/tools.length)*100).toFixed(1)}%)`);
console.log(`⚠️  Placeholder:     ${placeholderCount} (${((placeholderCount/tools.length)*100).toFixed(1)}%)`);
if (namingIssues > 0) {
  console.log(`⚠️  Naming Issues:   ${namingIssues} (${((namingIssues/tools.length)*100).toFixed(1)}%)`);
}
console.log('='.repeat(60));
console.log(`\n📄 Full report: ${reportPath}\n`);

// Exit with error if issues found
if (missingCount > 0 || placeholderCount > 0) {
  console.log('⚠️  Issues found! Review the report for details.\n');
  process.exit(1);
} else {
  console.log('✅ All tools have valid implementations!\n');
  process.exit(0);
}

/**
 * Detect naming convention for a category by analyzing actual exports
 */
async function detectCategoryConventions(tools) {
  const conventions = {};
  const categoriesProcessed = new Set();

  for (const tool of tools) {
    if (categoriesProcessed.has(tool.category)) continue;

    const handlerPath = join(DIST, tool.handler);
    if (!existsSync(handlerPath)) continue;

    try {
      const handlerUrl = pathToFileURL(handlerPath).href;
      const handlerModule = await import(handlerUrl);

      // Sample the first few exports to detect pattern
      const exports = Object.keys(handlerModule).filter(k => typeof handlerModule[k] === 'function');

      if (exports.length === 0) {
        conventions[tool.category] = 'unknown';
        categoriesProcessed.add(tool.category);
        continue;
      }

      // Analyze naming pattern
      const sample = exports.slice(0, 5);
      const hasUnderscores = sample.some(e => e.includes('_'));
      const hasCamelCase = sample.some(e => /[a-z][A-Z]/.test(e));
      const startsWithCategory = sample.every(e => e.toLowerCase().startsWith(tool.category.toLowerCase()));

      let convention = 'normalized'; // Default: use normalization

      if (hasUnderscores) {
        convention = 'snake_case';
      } else if (hasCamelCase && startsWithCategory) {
        // Check if it's categoryNameAction or categorynameAction
        const firstExport = sample[0];
        const afterCategory = firstExport.slice(tool.category.length);
        if (afterCategory.length > 0 && afterCategory[0] === afterCategory[0].toLowerCase()) {
          convention = 'category_lowercase_then_camel'; // e.g., openaiagentCreate
        } else {
          convention = 'camelCase'; // e.g., openaiAgentCreate
        }
      }

      conventions[tool.category] = convention;
      categoriesProcessed.add(tool.category);

      console.log(`  ${tool.category.padEnd(15)} -> ${convention}`);

    } catch (error) {
      conventions[tool.category] = 'unknown';
      categoriesProcessed.add(tool.category);
    }
  }

  console.log();
  return conventions;
}

/**
 * Normalize a name for comparison based on convention
 */
function normalizeName(name, convention = 'normalized') {
  if (convention === 'snake_case') {
    // Keep underscores, just lowercase
    return name.toLowerCase();
  } else if (convention === 'camelCase') {
    // Convert snake_case to camelCase
    return name.split('_').map((p, i) =>
      i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    ).join('');
  } else if (convention === 'category_lowercase_then_camel') {
    // e.g., openai_agent_create -> openaiagentCreate
    const parts = name.split('_');
    if (parts.length < 2) return name.toLowerCase();
    const category = parts[0].toLowerCase();
    const rest = parts.slice(1);
    return category + rest.slice(0, -1).map(p => p.toLowerCase()).join('') +
           (rest.length > 0 ? rest[rest.length - 1].charAt(0).toUpperCase() + rest[rest.length - 1].slice(1).toLowerCase() : '');
  } else {
    // Default: remove all separators and lowercase
    return name.toLowerCase().replace(/[_\-\.]/g, '');
  }
}

/**
 * Find handler function in module using multiple patterns
 */
function findHandlerInModule(module, toolName, convention = 'normalized') {
  const normalizedToolName = normalizeName(toolName, convention);

  // Pattern 1: Direct function exports (export function name() {})
  // Pattern 2: Const arrow function exports (export const name = () => {})
  for (const [exportName, exportValue] of Object.entries(module)) {
    if (typeof exportValue === 'function') {
      if (normalizeName(exportName, convention) === normalizedToolName) {
        return { fn: exportValue, name: exportName, pattern: 'direct-export', convention };
      }
    }
  }

  // Pattern 3: Handlers object (export const handlers = { name: fn, ... })
  if (module.handlers && typeof module.handlers === 'object') {
    for (const [handlerName, handlerFn] of Object.entries(module.handlers)) {
      if (typeof handlerFn === 'function') {
        if (normalizeName(handlerName, convention) === normalizedToolName) {
          return { fn: handlerFn, name: handlerName, pattern: 'handlers-object', convention };
        }
      }
    }
  }

  // Fallback: Try normalized comparison (remove all separators)
  if (convention !== 'normalized') {
    const fallbackNormalized = normalizeName(toolName, 'normalized');
    for (const [exportName, exportValue] of Object.entries(module)) {
      if (typeof exportValue === 'function') {
        if (normalizeName(exportName, 'normalized') === fallbackNormalized) {
          return { fn: exportValue, name: exportName, pattern: 'direct-export-fallback', convention: 'normalized' };
        }
      }
    }
  }

  // Pattern 4: Default export
  if (module.default && typeof module.default === 'function') {
    return { fn: module.default, name: 'default', pattern: 'default-export', convention };
  }

  return null;
}

/**
 * Audit a single tool
 */
async function auditTool(tool, convention = 'normalized') {
  const result = {
    toolId: tool.name,
    categoryId: tool.category,
    handlerFile: tool.handler,
    expectedFunctionName: normalizeName(tool.name, convention),
    namingConvention: convention,
    status: 'ok',
    reason: null,
  };

  // Resolve handler file path
  const handlerPath = join(DIST, tool.handler);

  if (!existsSync(handlerPath)) {
    result.status = 'missing_handler';
    result.reason = `Handler file not found: ${handlerPath}`;
    return result;
  }

  // Try to import and check handler
  try {
    // Convert to file:// URL for Windows compatibility
    const handlerUrl = pathToFileURL(handlerPath).href;
    const handlerModule = await import(handlerUrl);

    // Find handler using the detected convention
    const handlerInfo = findHandlerInModule(handlerModule, tool.name, convention);

    if (!handlerInfo) {
      result.status = 'missing_handler';
      result.reason = `Handler function not found for '${tool.name}' (expected: '${result.expectedFunctionName}' using ${convention} convention)`;

      // List available exports for debugging
      const availableExports = Object.keys(handlerModule)
        .filter(k => typeof handlerModule[k] === 'function')
        .slice(0, 5);
      if (availableExports.length > 0) {
        result.reason += `. Available exports: ${availableExports.join(', ')}`;
      }

      return result;
    }

    // Record actual function name and pattern
    result.actualFunctionName = handlerInfo.name;
    result.exportPattern = handlerInfo.pattern;
    result.usedConvention = handlerInfo.convention;

    // Check if naming differs from expected (only if not using fallback)
    if (handlerInfo.convention !== convention && handlerInfo.pattern !== 'default-export') {
      result.namingIssue = `Found using ${handlerInfo.convention} convention instead of detected ${convention}`;
    }

    // Check function source for placeholder patterns
    const fnSource = handlerInfo.fn.toString();
    const placeholderCheck = checkForPlaceholders(fnSource, tool.name);

    if (placeholderCheck.isPlaceholder) {
      result.status = 'placeholder';
      result.reason = placeholderCheck.reason;
    }

  } catch (error) {
    result.status = 'missing_handler';
    result.reason = `Error loading handler: ${error.message}`;
  }

  return result;
}

/**
 * Convert tool name to handler function name
 * e.g., github_create_repo → githubCreateRepo
 */
function getHandlerFunctionName(toolName) {
  return toolName
    .split('_')
    .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Check function source for placeholder patterns
 */
function checkForPlaceholders(source, toolName) {
  const patterns = [
    { regex: /throw new Error\(['"]Not implemented/i, reason: 'Throws "Not implemented" error' },
    { regex: /throw new Error\(['"]TODO/i, reason: 'Throws "TODO" error' },
    { regex: /console\.(warn|log)\(['"]TODO/i, reason: 'Contains TODO comment' },
    { regex: /console\.(warn|log)\(['"]stub/i, reason: 'Contains stub comment' },
    { regex: /placeholder:\s*true/i, reason: 'Returns { placeholder: true }' },
    { regex: /status:\s*['"]not implemented/i, reason: 'Returns { status: "not implemented" }' },
    { regex: /return\s*{\s*}/i, reason: 'Returns empty object {}' },
    { regex: /return\s*null/i, reason: 'Returns null' },
    { regex: /return\s*undefined/i, reason: 'Returns undefined' },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(source)) {
      return { isPlaceholder: true, reason: pattern.reason };
    }
  }

  // Check for suspiciously short implementations (likely stubs)
  if (source.length < 100 && !source.includes('return')) {
    return { isPlaceholder: true, reason: 'Suspiciously short implementation with no return' };
  }

  return { isPlaceholder: false };
}

