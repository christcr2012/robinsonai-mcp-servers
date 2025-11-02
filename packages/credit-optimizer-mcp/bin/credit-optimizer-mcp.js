#!/usr/bin/env node

/**
 * Wrapper script for Credit Optimizer MCP
 * Handles workspace root detection from command-line arguments
 */

// Parse command-line arguments for --workspace-root
const args = process.argv.slice(2);
const workspaceRootIndex = args.indexOf('--workspace-root');

if (workspaceRootIndex !== -1 && args[workspaceRootIndex + 1]) {
  // Set WORKSPACE_ROOT environment variable from command-line argument
  process.env.WORKSPACE_ROOT = args[workspaceRootIndex + 1];
  console.error(`[Wrapper] Set WORKSPACE_ROOT from CLI: ${process.env.WORKSPACE_ROOT}`);
}

// Import and run the actual server
import('../dist/index.js').catch((error) => {
  console.error('Failed to start Credit Optimizer MCP:', error);
  process.exit(1);
});

