#!/usr/bin/env node
/**
 * Free Agent MCP CLI
 *
 * Usage:
 *   free-agent-mcp serve            # Run as MCP server (stdio)
 *   free-agent-mcp run --repo <path> --task "..." [options]
 */

(async () => {
  const [,, cmd, ...rest] = process.argv;

  if (cmd === "serve") {
    // Start MCP server over stdio
    const { startServer } = await import("./index.js");
    await startServer();
  } else if (cmd === "run") {
    // One-shot codegen/patch for any repo
    const { runOneShot } = await import("./one-shot.js");
    await runOneShot(rest);
  } else {
    console.log(`Free Agent MCP - Portable, workspace-agnostic code generation

Usage:
  free-agent-mcp serve
    Run as MCP server (stdio mode for Augment/VS Code)

  free-agent-mcp run --repo <path> --task "..." [options]
    One-shot code generation for any repository

Options for 'run':
  --repo <path>          Target repository path (required)
  --task <description>   What to build/fix (required)
  --quality <level>      Quality level: auto|fast|safe|balanced|best (default: auto)
  --kind <type>          Task type: feature|bugfix|refactor|research (default: feature)
  --generator <module>   Generator module specifier (default: free-agent-mcp/generators/ops)

Environment Variables:
  FREE_AGENT_GENERATOR   Default generator module
  FREE_AGENT_TIER        Tier: free|paid (default: free)
  FREE_AGENT_QUALITY     Default quality level
  CODEGEN_VERBOSE        Enable verbose logging (1=on)

Examples:
  # Run as MCP server
  npx free-agent-mcp serve

  # One-shot code generation
  npx free-agent-mcp run \\
    --repo /path/to/repo \\
    --task "Add handler for github_list_artifacts" \\
    --quality auto \\
    --kind feature
`);
    process.exit(cmd ? 1 : 0);
  }
})();

