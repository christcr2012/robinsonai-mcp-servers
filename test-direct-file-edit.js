// Direct test of file editing without orchestrator
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testDirectFileEdit() {
  console.log('🧪 Testing direct file editing...\n');
  
  // Start free-agent MCP server (no API key needed!)
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['packages/free-agent-mcp/dist/index.js'],
    env: process.env
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  console.log('✅ Connected to free-agent\n');

  // Call the file editing tool
  const task = "Convert Vercel tools from multi-line to single-line format in packages/robinsons-toolkit-mcp/src/index.ts (lines 643-650). DIRECTLY EDIT THE FILE.";

  console.log(`📝 Task: ${task}\n`);

  try {
    const result = await client.callTool({
      name: 'execute_versatile_task_autonomous-agent-mcp',
      arguments: {
        task,
        taskType: 'file_editing',
        params: {
          context: 'TypeScript, MCP tools, single-quote single-line format'
        }
      }
    });
    
    console.log('\n✅ Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

testDirectFileEdit().catch(console.error);

