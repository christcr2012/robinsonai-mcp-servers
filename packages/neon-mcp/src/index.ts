#!/usr/bin/env node

/**
 * @robinsonai/neon-mcp
 * Enhanced Neon Database MCP Server by Robinson AI Systems
 * 
 * Currently wraps the official Neon MCP with Robinson AI branding.
 * Future enhancements will include:
 * - Advanced database workflows
 * - Migration management
 * - Performance monitoring
 * - Query optimization tools
 * - Backup/restore workflows
 * - Cost tracking and analytics
 */

import { spawn } from 'child_process';

console.error("@robinsonai/neon-mcp - Enhanced Neon Database MCP");
console.error("Powered by Robinson AI Systems");
console.error("");

// Get command and args (should be "start" and API key)
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: @robinsonai/neon-mcp start <NEON_API_KEY>");
  console.error("Or set NEON_API_KEY environment variable");
  process.exit(1);
}

// Spawn the official Neon MCP with our args
const neonMcp = spawn('npx', ['-y', '@neondatabase/mcp-server-neon', ...args], {
  stdio: 'inherit',
  shell: true
});

neonMcp.on('error', (error) => {
  console.error('Failed to start Neon MCP:', error);
  process.exit(1);
});

neonMcp.on('exit', (code) => {
  process.exit(code || 0);
});

