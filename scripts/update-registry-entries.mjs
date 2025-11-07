#!/usr/bin/env node
/**
 * Update index.ts registry to use new framework implementations
 * Replaces old handler-based entries with descriptor-based entries
 */

import fs from 'fs';
import path from 'path';

const FRAMEWORKS = [
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
];

const indexPath = path.join(process.cwd(), 'packages/thinking-tools-mcp/src/index.ts');
let content = fs.readFileSync(indexPath, 'utf8');

console.log('\n🔧 Updating registry entries for 14 frameworks\n');

for (const name of FRAMEWORKS) {
  const camelCase = name.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  
  // Find the old entry pattern
  const oldPattern = new RegExp(
    `framework_${name}:\\s*\\{[^}]*handler:\\s*async[^}]*\\}[^}]*\\},`,
    'gs'
  );
  
  // New descriptor-based entry
  const newEntry = `[${camelCase}Descriptor.name]: {
    ...${camelCase}Descriptor,
    handler: ${camelCase}Tool,
  },`;
  
  const before = content;
  content = content.replace(oldPattern, newEntry);
  
  if (content !== before) {
    console.log(`✅ Updated framework_${name}`);
  } else {
    console.log(`⚠️  Could not find framework_${name} entry`);
  }
}

// Write updated content
fs.writeFileSync(indexPath, content, 'utf8');

console.log(`\n✅ Registry update complete`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Build: npm run build`);
console.log(`   2. Test frameworks`);
console.log(`   3. Add parallel_thinking and reflective_thinking\n`);

