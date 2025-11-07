#!/usr/bin/env node
/**
 * Update index.ts to import and register all framework implementations
 */

import fs from 'fs';
import path from 'path';

const FRAMEWORKS = [
  'devils_advocate',
  'swot',
  'first_principles',
  'root_cause',
  'premortem',
  'critical_thinking',
  'lateral_thinking',
  'red_team',
  'blue_team',
  'decision_matrix',
  'socratic',
  'systems_thinking',
  'scenario_planning',
  'brainstorming',
  'mind_mapping',
  // NEW: Missing frameworks from CognitiveCompass
  'inversion',
  'second_order_thinking',
  'ooda_loop',
  'cynefin_framework',
  'design_thinking',
  'probabilistic_thinking',
  'bayesian_updating',
];

const indexPath = path.join(process.cwd(), 'packages/thinking-tools-mcp/src/index.ts');
let content = fs.readFileSync(indexPath, 'utf8');

// Generate import statements
const imports = FRAMEWORKS.map(name => {
  const camelCase = name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  const fileName = name.replace(/_/g, '-');
  return `import { ${camelCase}Tool, ${camelCase}Descriptor } from './tools/framework-${fileName}.js';`;
}).join('\n');

// Find the line with "// NEW: Stateful framework implementations"
const importMarker = '// NEW: Stateful framework implementations';
const importIndex = content.indexOf(importMarker);

if (importIndex === -1) {
  console.error('❌ Could not find import marker in index.ts');
  process.exit(1);
}

// Insert imports after the marker
const beforeImports = content.slice(0, importIndex + importMarker.length);
const afterImports = content.slice(importIndex + importMarker.length);

// Remove old devils_advocate import line if it exists
const newAfterImports = afterImports.replace(/import \{ devilsAdvocateTool.*?\n/, '');

content = beforeImports + '\n' + imports + newAfterImports;

// Write updated content
fs.writeFileSync(indexPath, content, 'utf8');

console.log(`✅ Added ${FRAMEWORKS.length} framework imports to index.ts`);
console.log(`\n⚠️  Next step: Update registry entries (manual step required)`);
console.log(`   Replace old framework entries with new descriptor-based entries\n`);

