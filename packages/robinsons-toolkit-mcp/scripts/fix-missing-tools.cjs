#!/usr/bin/env node

/**
 * Fix Missing Tools in Robinson's Toolkit
 * 
 * This script:
 * 1. Scans all handler methods
 * 2. Detects their category from section comments
 * 3. Generates missing tool definitions
 * 4. Generates missing case statements
 * 5. Outputs fixes to apply
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../src/index.ts');
const AUDIT_REPORT_PATH = path.join(__dirname, '../audit-report.json');

console.log('🔧 FIXING MISSING TOOLS IN ROBINSON\'S TOOLKIT\n');
console.log('='.repeat(80) + '\n');

// Read files
const content = fs.readFileSync(INDEX_PATH, 'utf-8');
const auditReport = JSON.parse(fs.readFileSync(AUDIT_REPORT_PATH, 'utf-8'));

// Get handlers without definitions and without cases from audit
const handlersWithoutDefinitions = new Set(auditReport.issues.handlersWithoutDefinitions);
const handlersWithoutCases = new Set(auditReport.issues.handlersWithoutCases);

console.log(`📊 Issues to fix:`);
console.log(`  - Handlers without definitions: ${handlersWithoutDefinitions.size}`);
console.log(`  - Handlers without cases: ${handlersWithoutCases.size}\n`);

// Extract all handlers with their line numbers and surrounding context
const lines = content.split('\n');
const handlers = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/private async ([a-zA-Z0-9_]+)\(args: any\)/);

  if (match) {
    const handlerName = match[1];

    // Detect category from handler name first (more reliable)
    let category = 'unknown';
    let subcategory = '';

    // Check handler name prefix patterns
    if (handlerName.startsWith('upstash')) {
      category = 'upstash';
    } else if (handlerName.startsWith('neon')) {
      category = 'neon';
    } else if (handlerName.startsWith('openai')) {
      category = 'openai';
    } else if (handlerName.startsWith('gmail') || handlerName.startsWith('drive') ||
               handlerName.startsWith('calendar') || handlerName.startsWith('sheets') ||
               handlerName.startsWith('docs') || handlerName.startsWith('slides') ||
               handlerName.startsWith('forms') || handlerName.startsWith('admin') ||
               handlerName.startsWith('people') || handlerName.startsWith('tasks') ||
               handlerName.startsWith('chat') || handlerName.startsWith('classroom') ||
               handlerName.startsWith('reports') || handlerName.startsWith('licensing')) {
      category = 'google';
    } else {
      // If no prefix match, analyze handler body to detect API calls
      // Look forward 50 lines to find API calls
      let bodyLines = [];
      for (let j = i; j < Math.min(lines.length, i + 50); j++) {
        bodyLines.push(lines[j]);
        if (lines[j].includes('  }') && j > i + 2) break; // End of method
      }
      const body = bodyLines.join('\n');

      // Detect by API calls
      if (body.includes('this.vercelFetch') || body.includes('VERCEL_BASE_URL')) {
        category = 'vercel';
      } else if (body.includes('this.client.get') || body.includes('this.client.post') ||
                 body.includes('this.client.patch') || body.includes('this.client.delete') ||
                 body.includes('/repos/') || body.includes('/orgs/') || body.includes('/user/')) {
        category = 'github';
      } else if (body.includes('this.neonFetch') || body.includes('NEON_BASE_URL')) {
        category = 'neon';
      } else if (body.includes('this.upstashManagementFetch') || body.includes('this.upstashRedisFetch')) {
        category = 'upstash';
      } else if (body.includes('this.gmail') || body.includes('this.drive') ||
                 body.includes('this.calendar') || body.includes('this.sheets')) {
        category = 'google';
      } else if (body.includes('this.openaiClient') || body.includes('openai.')) {
        category = 'openai';
      } else {
        // Last resort: look backwards for section comment
        for (let j = i - 1; j >= Math.max(0, i - 500); j--) {
          const commentLine = lines[j];

          if (commentLine.includes('// GITHUB') || commentLine.includes('GITHUB HANDLER')) {
            category = 'github';
            break;
          }
          if (commentLine.includes('// VERCEL') || commentLine.includes('VERCEL HANDLER')) {
            category = 'vercel';
            break;
          }
          if (commentLine.includes('// NEON') || commentLine.includes('NEON HANDLER')) {
            category = 'neon';
            break;
          }
          if (commentLine.includes('// UPSTASH')) {
            category = 'upstash';
            break;
          }
          if (commentLine.includes('// GOOGLE') || commentLine.includes('GOOGLE WORKSPACE')) {
            category = 'google';
            break;
          }
          if (commentLine.includes('// OPENAI')) {
            category = 'openai';
            break;
          }
        }
      }
    }
    
    handlers.push({
      name: handlerName,
      lineNumber: i + 1,
      category,
      subcategory,
      needsDefinition: handlersWithoutDefinitions.has(handlerName),
      needsCase: handlersWithoutCases.has(handlerName)
    });
  }
}

console.log(`✅ Found ${handlers.length} total handlers\n`);

// Convert handler name to tool name
function handlerToToolName(handlerName, category) {
  // Convert camelCase to snake_case
  const snakeCase = handlerName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
  
  // Add category prefix if not already present
  if (snakeCase.startsWith(category + '_')) {
    return snakeCase;
  }
  
  return `${category}_${snakeCase}`;
}

// Group handlers by category
const byCategory = {};
handlers.forEach(h => {
  if (!byCategory[h.category]) {
    byCategory[h.category] = [];
  }
  byCategory[h.category].push(h);
});

console.log('📊 Handlers by category:\n');
Object.keys(byCategory).sort().forEach(cat => {
  const total = byCategory[cat].length;
  const needsDef = byCategory[cat].filter(h => h.needsDefinition).length;
  const needsCase = byCategory[cat].filter(h => h.needsCase).length;
  console.log(`  ${cat}: ${total} handlers (${needsDef} need definitions, ${needsCase} need cases)`);
});

console.log('\n' + '='.repeat(80) + '\n');

// Generate fixes
const missingDefinitions = handlers.filter(h => h.needsDefinition);
const missingCases = handlers.filter(h => h.needsCase);

console.log(`🔧 Generating fixes...\n`);

// Write missing tool definitions
if (missingDefinitions.length > 0) {
  console.log(`📝 Missing Tool Definitions (${missingDefinitions.length}):\n`);
  
  const definitionsByCategory = {};
  missingDefinitions.forEach(h => {
    if (!definitionsByCategory[h.category]) {
      definitionsByCategory[h.category] = [];
    }
    definitionsByCategory[h.category].push(h);
  });
  
  const outputLines = [];
  
  Object.keys(definitionsByCategory).sort().forEach(cat => {
    outputLines.push(`\n// ${cat.toUpperCase()} - Missing Definitions (${definitionsByCategory[cat].length})`);
    
    definitionsByCategory[cat].forEach(h => {
      const toolName = handlerToToolName(h.name, cat);
      const description = `${h.name} - Auto-generated from handler`;
      
      outputLines.push(`{ name: '${toolName}', description: '${description}', inputSchema: { type: 'object', properties: {} } },`);
    });
  });
  
  fs.writeFileSync(
    path.join(__dirname, '../missing-tool-definitions.txt'),
    outputLines.join('\n')
  );
  
  console.log(`✅ Written to: missing-tool-definitions.txt\n`);
}

// Write missing case statements
if (missingCases.length > 0) {
  console.log(`📝 Missing Case Statements (${missingCases.length}):\n`);
  
  const casesByCategory = {};
  missingCases.forEach(h => {
    if (!casesByCategory[h.category]) {
      casesByCategory[h.category] = [];
    }
    casesByCategory[h.category].push(h);
  });
  
  const outputLines = [];
  
  Object.keys(casesByCategory).sort().forEach(cat => {
    outputLines.push(`\n// ${cat.toUpperCase()} - Missing Cases (${casesByCategory[cat].length})`);
    
    casesByCategory[cat].forEach(h => {
      const toolName = handlerToToolName(h.name, cat);
      outputLines.push(`case '${toolName}': return await this.${h.name}(args);`);
    });
  });
  
  fs.writeFileSync(
    path.join(__dirname, '../missing-case-statements.txt'),
    outputLines.join('\n')
  );
  
  console.log(`✅ Written to: missing-case-statements.txt\n`);
}

console.log('✨ Done! Review the generated files and apply the fixes.\n');

