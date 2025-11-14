import fs from 'fs';

const text = fs.readFileSync('claude-pricing-text.txt', 'utf-8');
const lines = text.split('\n');

console.log('📄 Total lines:', lines.length);
console.log('\n🔍 Looking for model names...\n');

// Find Sonnet 4.5
const sonnetIdx = lines.findIndex(l => l.trim() === 'Sonnet 4.5');
console.log('Sonnet 4.5 index:', sonnetIdx);
if (sonnetIdx >= 0) {
  console.log('Lines around Sonnet 4.5:');
  for (let i = sonnetIdx; i < sonnetIdx + 15; i++) {
    console.log(`  ${i}: "${lines[i]}"`);
  }
  
  const inputIdx = lines.findIndex((l, i) => i > sonnetIdx && i < sonnetIdx + 5 && l.trim() === 'Input');
  const outputIdx = lines.findIndex((l, i) => i > sonnetIdx && i < sonnetIdx + 15 && l.trim() === 'Output');
  
  console.log('\nInput index:', inputIdx);
  console.log('Output index:', outputIdx);
  
  if (inputIdx >= 0) {
    console.log('\nLines after Input:');
    for (let i = inputIdx; i < inputIdx + 5; i++) {
      console.log(`  ${i}: "${lines[i]}" - includes $: ${lines[i].includes('$')}, includes MTok: ${lines[i].includes('MTok')}`);
    }
    
    const inputPriceLine = lines.find((l, i) => i > inputIdx && i < inputIdx + 5 && l.includes('$') && l.includes('MTok'));
    console.log('\nInput price line:', inputPriceLine);
    if (inputPriceLine) {
      const match = inputPriceLine.match(/\$(\d+)/);
      console.log('Match:', match);
    }
  }
  
  if (outputIdx >= 0) {
    console.log('\nLines after Output:');
    for (let i = outputIdx; i < outputIdx + 5; i++) {
      console.log(`  ${i}: "${lines[i]}" - includes $: ${lines[i].includes('$')}, includes MTok: ${lines[i].includes('MTok')}`);
    }
    
    const outputPriceLine = lines.find((l, i) => i > outputIdx && i < outputIdx + 5 && l.includes('$') && l.includes('MTok'));
    console.log('\nOutput price line:', outputPriceLine);
    if (outputPriceLine) {
      const match = outputPriceLine.match(/\$(\d+)/);
      console.log('Match:', match);
    }
  }
}

