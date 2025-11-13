import fs from 'fs';

// Count Paid Agent tools
const paidContent = fs.readFileSync('packages/paid-agent-mcp/src/index.ts', 'utf8');
const paidToolsMatch = paidContent.match(/server\.setRequestHandler\(ListToolsRequestSchema[\s\S]*?tools:\s*\[([\s\S]*?)\]\s*}/);

if (paidToolsMatch) {
  const toolsArray = paidToolsMatch[1];
  
  // Count explicit tool objects (with name: property)
  const explicitTools = [...toolsArray.matchAll(/\{\s*name:\s*['\"]([^'\"]+)['\"]/g)];
  
  // Count imported tool references (run_parallel, paths_probe, generator_probe)
  const importedTools = [...toolsArray.matchAll(/^\s*(run_parallel|paths_probe|generator_probe)\s*,?\s*$/gm)];
  
  console.log('=== PAID AGENT TOOLS ===');
  console.log(`Explicit tools (with name: property): ${explicitTools.length}`);
  console.log(`Imported tool objects: ${importedTools.length}`);
  console.log(`TOTAL: ${explicitTools.length + importedTools.length}`);
  console.log('\nExplicit tools:');
  explicitTools.forEach((m, i) => console.log(`${i+1}. ${m[1]}`));
  console.log('\nImported tools:');
  importedTools.forEach((m, i) => console.log(`${explicitTools.length + i+1}. ${m[1]}`));
}

// Count Free Agent tools
const freeContent = fs.readFileSync('packages/free-agent-mcp/src/index.ts', 'utf8');
const freeToolsMatch = freeContent.match(/private getTools\(\): Tool\[\] \{[\s\S]*?return \[([\s\S]*?)\n\s{4}\]/);

if (freeToolsMatch) {
  const toolsArray = freeToolsMatch[1];
  
  // Count explicit tool objects
  const explicitTools = [...toolsArray.matchAll(/\{\s*name:\s*['\"]([^'\"]+)['\"]/g)];
  
  // Count imported tool references
  const importedTools = [...toolsArray.matchAll(/^\s*(run_parallel|paths_probe|generator_probe)\s*,?\s*$/gm)];
  
  console.log('\n=== FREE AGENT TOOLS ===');
  console.log(`Explicit tools (with name: property): ${explicitTools.length}`);
  console.log(`Imported tool objects: ${importedTools.length}`);
  console.log(`TOTAL: ${explicitTools.length + importedTools.length}`);
  console.log('\nExplicit tools:');
  explicitTools.forEach((m, i) => console.log(`${i+1}. ${m[1]}`));
  console.log('\nImported tools:');
  importedTools.forEach((m, i) => console.log(`${explicitTools.length + i+1}. ${m[1]}`));
}

