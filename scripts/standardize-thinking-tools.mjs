#!/usr/bin/env node
/**
 * Standardize Thinking Tools MCP naming
 * Renames all tools to follow {category}_{action} pattern
 */

import fs from 'fs';
import path from 'path';

const RENAME_MAP = {
  // Cognitive Frameworks (18 renames)
  'devils_advocate': 'framework_devils_advocate',
  'first_principles': 'framework_first_principles',
  'root_cause': 'framework_root_cause',
  'swot_analysis': 'framework_swot',
  'premortem_analysis': 'framework_premortem',
  'critical_thinking': 'framework_critical_thinking',
  'lateral_thinking': 'framework_lateral_thinking',
  'red_team': 'framework_red_team',
  'blue_team': 'framework_blue_team',
  'decision_matrix': 'framework_decision_matrix',
  'socratic_questioning': 'framework_socratic',
  'systems_thinking': 'framework_systems_thinking',
  'scenario_planning': 'framework_scenario_planning',
  'brainstorming': 'framework_brainstorming',
  'mind_mapping': 'framework_mind_mapping',
  'sequential_thinking': 'framework_sequential_thinking',
  'parallel_thinking': 'framework_parallel_thinking',
  'reflective_thinking': 'framework_reflective_thinking',
  
  // Context Engine (1 rename)
  'ensure_fresh_index': 'context_ensure_fresh_index',
  
  // Web Tools (3 renames - remove duplicates)
  'ctx_web_search': 'web_search',
  'ctx_web_fetch': 'web_fetch',
  'ctx_web_crawl_step': 'web_crawl',
  
  // Evidence Collection (4 renames)
  'ctx_import_evidence': 'evidence_import',
  'ctx_merge_config': 'evidence_merge_config',
  'context7_adapter': 'evidence_context7_adapter',
  'think_collect_evidence': 'evidence_collect',
  
  // Thinking Artifacts (6 renames)
  'think_swot': 'artifact_swot',
  'think_devils_advocate': 'artifact_devils_advocate',
  'think_premortem': 'artifact_premortem',
  'think_decision_matrix': 'artifact_decision_matrix',
  'think_critique_checklist': 'artifact_critique_checklist',
  'think_auto_packet': 'artifact_auto_packet',
  
  // LLM Rewrite (2 renames)
  'think_llm_rewrite_prep': 'llm_rewrite_prep',
  'think_llm_apply': 'llm_rewrite_apply',
  
  // Validation (2 renames)
  'thinking_tools_validate': 'validation_tools',
  'think_validate_artifacts': 'validation_artifacts',
  
  // Health (1 rename)
  'thinking_tools_health_check': 'health_check',
};

console.log(`\n🔧 Thinking Tools MCP Standardization Script`);
console.log(`📋 Will rename ${Object.keys(RENAME_MAP).length} tools\n`);

const indexPath = path.join(process.cwd(), 'packages/thinking-tools-mcp/src/index.ts');
let content = fs.readFileSync(indexPath, 'utf8');
let changes = 0;

// Rename in registry keys
for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
  // Match registry entries like: devils_advocate: {
  const registryPattern = new RegExp(`(\\s+)${oldName}(\\s*:\\s*\\{)`, 'g');
  if (registryPattern.test(content)) {
    content = content.replace(registryPattern, `$1${newName}$2`);
    console.log(`✅ Renamed registry key: ${oldName} → ${newName}`);
    changes++;
  }
  
  // Match descriptor references like: [devilsAdvocateDescriptor.name]
  const camelCase = oldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  const descriptorPattern = new RegExp(`\\[${camelCase}Descriptor\\.name\\]`, 'g');
  if (descriptorPattern.test(content)) {
    console.log(`ℹ️  Found descriptor reference for ${oldName} (will update descriptor files separately)`);
  }
}

// Write updated content
fs.writeFileSync(indexPath, content, 'utf8');

console.log(`\n✅ Updated ${changes} tool names in index.ts`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Update individual tool descriptor files`);
console.log(`   2. Update tool handler functions`);
console.log(`   3. Update InitializeRequestSchema metadata`);
console.log(`   4. Build and test`);
console.log(`   5. Update CHANGELOG for v2.0.0\n`);

