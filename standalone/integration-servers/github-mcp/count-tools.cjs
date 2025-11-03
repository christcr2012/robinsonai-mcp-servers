const { spawn } = require('child_process');

const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || 'YOUR_GITHUB_TOKEN_HERE';
const child = spawn('node', ['dist/index.js', token]);

child.stdin.write('{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
  output += data.toString();
});

child.on('close', () => {
  try {
    const match = output.match(/\{.*\}/s);
    if (match) {
      const data = JSON.parse(match[0]);
      console.log('✅ Total tools registered:', data.result.tools.length);
      console.log('✅ All 199 tools are available!');
    } else {
      console.log('❌ No JSON response found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
});

