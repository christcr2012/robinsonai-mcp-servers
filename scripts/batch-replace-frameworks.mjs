#!/usr/bin/env node
/**
 * Batch replace all framework registry entries
 */

import fs from 'fs';
import path from 'path';

const FRAMEWORKS = [
  { old: 'framework_premortem', new: 'premortem' },
  { old: 'framework_critical_thinking', new: 'criticalThinking' },
  { old: 'framework_lateral_thinking', new: 'lateralThinking' },
  { old: 'framework_red_team', new: 'redTeam' },
  { old: 'framework_blue_team', new: 'blueTeam' },
  { old: 'framework_decision_matrix', new: 'decisionMatrix' },
  { old: 'framework_socratic', new: 'socratic' },
  { old: 'framework_systems_thinking', new: 'systemsThinking' },
  { old: 'framework_scenario_planning', new: 'scenarioPlanning' },
  { old: 'framework_brainstorming', new: 'brainstorming' },
  { old: 'framework_mind_mapping', new: 'mindMapping' },
  { old: 'framework_first_principles', new: 'firstPrinciples' },
  { old: 'framework_root_cause', new: 'rootCause' },
];

const indexPath = path.join(process.cwd(), 'packages/thinking-tools-mcp/src/index.ts');
let content = fs.readFileSync(indexPath, 'utf8');

console.log('\n🔧 Batch replacing 13 framework entries\n');

for (const { old, new: newName } of FRAMEWORKS) {
  // Match the entire entry block
  const pattern = new RegExp(
    `${old}:\\s*\\{[\\s\\S]*?handler:\\s*async[\\s\\S]*?\\},\\s*\\},`,
    'g'
  );
  
  const replacement = `[${newName}Descriptor.name]: {
    ...${newName}Descriptor,
    handler: ${newName}Tool,
  },`;
  
  const before = content;
  content = content.replace(pattern, replacement);
  
  if (content !== before) {
    console.log(`✅ Replaced ${old}`);
  } else {
    console.log(`⚠️  Could not find ${old}`);
  }
}

fs.writeFileSync(indexPath, content, 'utf8');

console.log(`\n✅ Batch replacement complete\n`);

