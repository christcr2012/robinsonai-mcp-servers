#!/usr/bin/env node
/**
 * Generate documentation from registry
 * 
 * Creates docs/ folder with:
 * - README.md (overview)
 * - One page per category with all tools documented
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const DOCS = join(ROOT, 'docs');

console.log('📚 Generating documentation...');

// Create docs directory
if (!existsSync(DOCS)) {
  mkdirSync(DOCS, { recursive: true });
}

// Load registry and categories
const registryPath = join(DIST, 'registry.json');
const categoriesPath = join(DIST, 'categories.json');
const tools = JSON.parse(readFileSync(registryPath, 'utf8'));
const categories = JSON.parse(readFileSync(categoriesPath, 'utf8'));

// Group tools by category
const toolsByCategory = {};
for (const tool of tools) {
  if (!toolsByCategory[tool.category]) {
    toolsByCategory[tool.category] = [];
  }
  toolsByCategory[tool.category].push(tool);
}

// Generate README.md
const readmeContent = `# Robinson's Toolkit MCP - Documentation

**Version:** 2.0.0  
**Total Tools:** ${tools.length}  
**Total Categories:** ${Object.keys(categories).length}

## 📦 Categories

${Object.entries(categories)
  .sort(([, a], [, b]) => b.toolCount - a.toolCount)
  .map(([name, info]) => {
    const subcatInfo = info.subcategories && info.subcategories.length > 0
      ? ` (${info.subcategories.length} subcategories)`
      : '';
    return `- [**${info.displayName}**](${name}.md) - ${info.description} (${info.toolCount} tools${subcatInfo})`;
  })
  .join('\n')}

## 🔧 How to Use

1. **Discover**: Use \`toolkit_discover\` or \`toolkit_search_tools\` to search for tools
2. **List**: Use \`toolkit_list_categories\` and \`toolkit_list_tools\` to browse
3. **Inspect**: Use \`toolkit_get_tool_schema\` to see parameters
4. **Execute**: Use \`toolkit_call\` to run any tool

## 📖 Category Documentation

Click on any category above to see detailed tool documentation.

## 🏷️ Tool Metadata

All tools include:
- **Tags**: Operation type (read, write, delete) and resource type (repo, issue, deployment, etc.)
- **Danger Level**: 
  - \`safe\` - Read-only operations
  - \`caution\` - Modifying operations
  - \`dangerous\` - Destructive operations (delete, remove, etc.)

## 🔍 Search Examples

\`\`\`javascript
// Find all safe GitHub tools
toolkit_search_tools({ query: "github", dangerLevel: "safe" })

// Find all delete operations
toolkit_search_tools({ query: "delete", dangerLevel: "dangerous" })

// Find all email tools
toolkit_search_tools({ query: "email", tags: ["email"] })
\`\`\`

---

Generated on ${new Date().toISOString()}
`;

writeFileSync(join(DOCS, 'README.md'), readmeContent);
console.log('✅ Generated README.md');

// Generate category pages
let generatedPages = 0;
for (const [categoryName, categoryInfo] of Object.entries(categories)) {
  const categoryTools = toolsByCategory[categoryName] || [];
  
  // Sort tools by name
  categoryTools.sort((a, b) => a.name.localeCompare(b.name));
  
  const content = generateCategoryPage(categoryName, categoryInfo, categoryTools);
  writeFileSync(join(DOCS, `${categoryName}.md`), content);
  generatedPages++;
}

console.log(`✅ Generated ${generatedPages} category pages`);
console.log(`📊 Total documentation files: ${generatedPages + 1}`);
console.log(`✅ Documentation written to ${DOCS}`);

function generateCategoryPage(categoryName, categoryInfo, tools) {
  const dangerCounts = {
    safe: tools.filter(t => t.dangerLevel === 'safe').length,
    caution: tools.filter(t => t.dangerLevel === 'caution').length,
    dangerous: tools.filter(t => t.dangerLevel === 'dangerous').length,
  };
  
  return `# ${categoryInfo.displayName}

${categoryInfo.description}

**Category ID:** \`${categoryName}\`  
**Total Tools:** ${tools.length}  
**Subcategories:** ${categoryInfo.subcategories?.join(', ') || 'None'}

## 📊 Tool Statistics

- 🟢 Safe (read-only): ${dangerCounts.safe}
- 🟡 Caution (modifying): ${dangerCounts.caution}
- 🔴 Dangerous (destructive): ${dangerCounts.dangerous}

## 🔧 Tools

${tools.map(tool => generateToolDoc(tool)).join('\n\n---\n\n')}

---

[← Back to Overview](README.md)
`;
}

function generateToolDoc(tool) {
  const dangerBadge = {
    safe: '🟢',
    caution: '🟡',
    dangerous: '🔴',
  }[tool.dangerLevel] || '⚪';
  
  const tags = tool.tags && tool.tags.length > 0
    ? tool.tags.map(t => `\`${t}\``).join(' ')
    : 'None';
  
  return `### ${dangerBadge} \`${tool.name}\`

${tool.description || 'No description available'}

**Tags:** ${tags}  
**Danger Level:** \`${tool.dangerLevel || 'unknown'}\`  
**Subcategory:** ${tool.subcategory || 'None'}
`;
}

