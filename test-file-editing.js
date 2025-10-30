/**
 * Test file editing capability directly
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testFileEditing() {
  console.log('🧪 Testing file editing capability...\n');

  // Connect to free-agent-mcp
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['packages/free-agent-mcp/dist/index.js'],
  });

  const client = new Client({
    name: 'test-file-editing',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  await client.connect(transport);
  console.log('✅ Connected to free-agent-mcp\n');

  // Test 1: Create a test file
  console.log('📝 Test 1: Create a test file');
  const createResult = await client.callTool({
    name: 'execute_versatile_task_autonomous-agent-mcp',
    arguments: {
      task: 'Create a file at test-output.txt with the content: "Hello from file editing! This is a test."',
      taskType: 'file_editing',
      params: {},
    },
  });

  console.log('Result:', JSON.stringify(createResult, null, 2));
  console.log('\n');

  // Test 2: Modify the file
  console.log('📝 Test 2: Modify the file');
  const modifyResult = await client.callTool({
    name: 'execute_versatile_task_autonomous-agent-mcp',
    arguments: {
      task: 'Replace "Hello" with "Goodbye" in test-output.txt',
      taskType: 'file_editing',
      params: {},
    },
  });

  console.log('Result:', JSON.stringify(modifyResult, null, 2));
  console.log('\n');

  // Test 3: Read the file to verify
  console.log('📝 Test 3: Read the file to verify');
  const readResult = await client.callTool({
    name: 'execute_versatile_task_autonomous-agent-mcp',
    arguments: {
      task: 'Read the contents of test-output.txt',
      taskType: 'file_editing',
      params: {},
    },
  });

  console.log('Result:', JSON.stringify(readResult, null, 2));
  console.log('\n');

  await client.close();
  console.log('✅ Tests complete!');
}

testFileEditing().catch(console.error);

