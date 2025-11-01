#!/usr/bin/env node
/**
 * Test if MCP servers are actually working by checking Augment logs for tool registration
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const isWindows = os.platform() === 'win32';

// Find VS Code logs directory
const logsDir = isWindows
  ? path.join(process.env.APPDATA, 'Code', 'logs')
  : path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'logs');

console.log('🔍 Searching for MCP tool registration in recent Augment logs...\n');

try {
  // Find most recent log folder
  const logFolders = fs.readdirSync(logsDir)
    .filter(f => fs.statSync(path.join(logsDir, f)).isDirectory())
    .sort()
    .reverse();
  
  if (logFolders.length === 0) {
    console.log('❌ No log folders found');
    process.exit(1);
  }
  
  const recentLogDir = path.join(logsDir, logFolders[0]);
  const augmentLogPath = path.join(recentLogDir, 'window1', 'exthost', 'Augment.vscode-augment', 'Augment.log');
  
  if (!fs.existsSync(augmentLogPath)) {
    console.log(`⚠️  Augment log not found at: ${augmentLogPath}`);
    console.log('   Try opening Augment chat to generate logs');
    process.exit(1);
  }
  
  console.log(`📂 Reading: ${augmentLogPath}\n`);
  const logContent = fs.readFileSync(augmentLogPath, 'utf8');
  const lines = logContent.split('\n');
  
  // Look for MCP host initialization and tool counts
  const mcpHostLines = lines.filter(line => 
    line.includes("'ToolsModel': Host: mcpHost") ||
    line.includes('MCP') ||
    line.includes('mcp')
  );
  
  if (mcpHostLines.length === 0) {
    console.log('❌ No MCP-related entries found in logs');
    console.log('   This suggests MCP may not be initialized');
  } else {
    console.log('✅ MCP entries found in logs:\n');
    
    // Extract tool registration lines
    const toolLines = lines.filter(line => line.includes("'ToolsModel': Host:"));
    
    if (toolLines.length > 0) {
      console.log('🔧 Tool Hosts Registered:');
      toolLines.slice(-10).forEach(line => {
        // Extract the meaningful part
        const match = line.match(/Host: (\w+) \((\d+) tools: (\d+) enabled/);
        if (match) {
          const [, hostName, totalTools, enabledTools] = match;
          console.log(`   ${hostName}: ${enabledTools}/${totalTools} tools enabled`);
        }
      });
    }
    
    // Look for specific MCP server names
    console.log('\n📦 MCP Servers Detected:');
    const serverPatterns = [
      'thinking-tools-mcp',
      'openai-mcp',
      'paid-agent-mcp',
      'credit-optimizer-mcp',
      'free-agent-mcp',
      'robinsons-toolkit'
    ];
    
    serverPatterns.forEach(server => {
      const mentions = lines.filter(line => line.includes(server)).length;
      if (mentions > 0) {
        console.log(`   ✅ ${server}: ${mentions} mentions`);
      } else {
        console.log(`   ❌ ${server}: not found`);
      }
    });
  }
  
  // Check for any errors
  console.log('\n⚠️  Checking for MCP errors:');
  const errorLines = lines.filter(line => 
    (line.includes('[error]') || line.includes('[warning]')) &&
    (line.includes('mcp') || line.includes('MCP'))
  );
  
  if (errorLines.length === 0) {
    console.log('   ✅ No MCP errors found');
  } else {
    console.log(`   Found ${errorLines.length} error/warning lines:`);
    errorLines.slice(-5).forEach(line => {
      console.log(`   - ${line.substring(0, 120)}...`);
    });
  }
  
} catch (err) {
  console.error('❌ Error reading logs:', err.message);
  process.exit(1);
}

console.log('\n💡 Summary:');
console.log('   If tools are registered, MCP is working even if UI doesn\'t show settings tab');
console.log('   Try using MCP tools in Augment chat with "@" mentions or direct requests');
console.log('\n');
