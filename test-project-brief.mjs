/**
 * Test Project Brief Generator
 * 
 * Demonstrates the auto-generated "Project Brief" that captures the repo's DNA.
 */

import { makeProjectBrief, formatBriefForPrompt } from './packages/free-agent-mcp/dist/utils/project-brief.js';

async function main() {
  console.log('🔍 Generating Project Brief for robinsonai-mcp-servers...\n');
  
  const startTime = Date.now();
  const brief = await makeProjectBrief(process.cwd());
  const elapsed = Date.now() - startTime;
  
  console.log(`✅ Brief generated in ${elapsed}ms\n`);
  console.log('=' .repeat(80));
  console.log(formatBriefForPrompt(brief));
  console.log('=' .repeat(80));
  
  console.log('\n📊 Brief Statistics:');
  console.log(`  - Language: ${brief.language}`);
  console.log(`  - Layering: ${brief.layering.type}`);
  console.log(`  - Testing: ${brief.testing.framework}`);
  console.log(`  - Entities: ${brief.glossary.entities.length}`);
  console.log(`  - Enums: ${brief.glossary.enums.length}`);
  console.log(`  - Constants: ${brief.glossary.constants.length}`);
  console.log(`  - Public APIs: ${brief.apis.publicExports.length}`);
  console.log(`  - Naming Examples: ${brief.naming.examples.length}`);
  console.log(`  - Do Not Touch: ${brief.doNotTouch.length} directories`);
  
  console.log('\n📝 Sample Entities:');
  console.log(`  ${brief.glossary.entities.slice(0, 10).join(', ')}`);
  
  console.log('\n📝 Sample Public APIs:');
  brief.apis.publicExports.slice(0, 5).forEach(api => {
    console.log(`  - ${api}`);
  });
  
  console.log('\n📝 Naming Conventions:');
  console.log(`  - Variables: ${brief.naming.variables}`);
  console.log(`  - Types: ${brief.naming.types}`);
  console.log(`  - Constants: ${brief.naming.constants}`);
  console.log(`  - Files: ${brief.naming.files}`);
  
  console.log('\n📝 Sample Naming Examples:');
  brief.naming.examples.slice(0, 10).forEach(example => {
    console.log(`  - ${example}`);
  });
  
  console.log('\n✅ Project Brief is ready to be injected into coder/judge prompts!');
}

main().catch(console.error);

