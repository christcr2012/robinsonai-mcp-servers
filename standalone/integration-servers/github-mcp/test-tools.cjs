const { execSync } = require('child_process');

const output = execSync('echo {"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}} | node dist/index.js test_token 2>&1').toString();
const lines = output.split('\n');
const jsonLine = lines.find(l => l.startsWith('{'));

if (jsonLine) {
  const data = JSON.parse(jsonLine);
  console.log('✅ GitHub MCP Server - Tool Count');
  console.log('Total tools:', data.result.tools.length);
  console.log('\nFirst 5 tools:');
  data.result.tools.slice(0, 5).forEach((t, i) => {
    console.log(`${i + 1}. ${t.name} - ${t.description}`);
  });
} else {
  console.log('❌ No JSON found in output');
}

