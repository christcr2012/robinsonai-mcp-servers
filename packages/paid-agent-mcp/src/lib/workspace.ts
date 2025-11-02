import { resolve } from "node:path";

/**
 * Get the workspace root directory for MCP server context.
 * Checks environment variables in order: INIT_CWD, WORKSPACE_ROOT, PWD
 * Falls back to process.cwd() if none are set.
 * 
 * This is critical for MCP servers because they run from VS Code's installation
 * directory, not the workspace root.
 */
export function getWorkspaceRoot(): string {
  const envVars = ['INIT_CWD', 'WORKSPACE_ROOT', 'PWD'];
  
  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) {
      console.error(`[WorkspaceRoot] Using ${varName}: ${value}`);
      return resolve(value);
    }
  }
  
  const fallback = resolve(process.cwd());
  console.error(`[WorkspaceRoot] No env vars set, using process.cwd(): ${fallback}`);
  return fallback;
}

