#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Robinson AI MCP Server');
console.log('=================================\n');

// Test the free-agent-mcp server
const serverPath = path.join('packages', 'free-agent-mcp', 'dist', 'index.js');

console.log(`📍 Testing server: ${serverPath}`);
console.log('🚀 Starting MCP server...\n');

// Start the MCP server
const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log('📤 STDOUT:', text.trim());
});

server.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    console.log('📥 STDERR:', text.trim());
});

server.on('close', (code) => {
    console.log(`\n🏁 Server exited with code: ${code}`);
    
    if (code === 0) {
        console.log('✅ Server started successfully!');
    } else {
        console.log('❌ Server failed to start');
        console.log('Error output:', errorOutput);
    }
});

server.on('error', (error) => {
    console.log('❌ Failed to start server:', error.message);
});

// Send a test MCP message after 2 seconds
setTimeout(() => {
    console.log('\n📨 Sending test MCP message...');
    
    const testMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
    };
    
    server.stdin.write(JSON.stringify(testMessage) + '\n');
}, 2000);

// Kill server after 10 seconds
setTimeout(() => {
    console.log('\n⏰ Test timeout - killing server');
    server.kill();
}, 10000);

console.log('⏳ Server test running... (will timeout in 10 seconds)');
