#!/usr/bin/env node

/**
 * @robinsonai/github-mcp
 * Enhanced GitHub MCP Server by Robinson AI Systems
 * 
 * Currently wraps the official GitHub MCP with Robinson AI branding.
 * Future enhancements will include:
 * - Advanced PR workflows and automation
 * - Issue management and automation
 * - GitHub Actions integration
 * - Release automation
 * - Code review automation
 * - Repository analytics
 * - Security scanning integration
 * - Project board management
 */

import { spawn } from 'child_process';

console.error("@robinsonai/github-mcp - Enhanced GitHub MCP");
console.error("Powered by Robinson AI Systems");
console.error("");

// Get GitHub token from environment variable
const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;

if (!githubToken) {
  console.error("Error: GitHub token required!");
  console.error("Set GITHUB_PERSONAL_ACCESS_TOKEN or GITHUB_TOKEN environment variable");
  process.exit(1);
}

// Spawn the official GitHub MCP with our token
const githubMcp = spawn('npx', ['-y', '@modelcontextprotocol/server-github'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    GITHUB_PERSONAL_ACCESS_TOKEN: githubToken
  }
});

githubMcp.on('error', (error) => {
  console.error('Failed to start GitHub MCP:', error);
  process.exit(1);
});

githubMcp.on('exit', (code) => {
  process.exit(code || 0);
});

