/**
 * Universal Workspace Root Detection
 * 
 * Provides consistent workspace root detection across all MCP servers.
 * This is critical because MCP servers run from VS Code's installation directory,
 * not the workspace root.
 * 
 * Strategy:
 * 1. Check WORKSPACE_ROOT environment variable (set by wrapper scripts)
 * 2. Check INIT_CWD (npm/pnpm sets this to invocation directory)
 * 3. Check PWD (shell current working directory)
 * 4. Search upward for workspace markers (.git, package.json, etc.)
 * 5. Fall back to process.cwd()
 */

import { resolve, dirname, join } from "node:path";
import { existsSync } from "node:fs";

/**
 * Common workspace markers to search for
 */
const WORKSPACE_MARKERS = [
  '.git',
  'package.json',
  'tsconfig.json',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  '.project',
  'workspace.code-workspace',
  'pyproject.toml',
  'setup.py',
  'Gemfile',
  'composer.json',
];

/**
 * Search upward from a directory to find workspace root
 */
function findWorkspaceRoot(startDir: string): string | null {
  let currentDir = resolve(startDir);
  const root = resolve('/');
  
  while (currentDir !== root) {
    // Check if any workspace marker exists in this directory
    for (const marker of WORKSPACE_MARKERS) {
      const markerPath = join(currentDir, marker);
      if (existsSync(markerPath)) {
        return currentDir;
      }
    }
    
    // Move up one directory
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  
  return null;
}

/**
 * Get the workspace root directory for MCP server context.
 * 
 * This function is called on EVERY file operation to ensure we always
 * use the latest WORKSPACE_ROOT value (which may be set after server startup).
 * 
 * @param explicitRoot - Optional explicit workspace root (takes highest priority)
 * @returns Absolute path to workspace root
 */
export function getWorkspaceRoot(explicitRoot?: string): string {
  // Priority 1: Explicitly provided workspace root
  if (explicitRoot && existsSync(explicitRoot)) {
    return resolve(explicitRoot);
  }
  
  // Priority 2-4: Environment variables
  const envVars = ['WORKSPACE_ROOT', 'INIT_CWD', 'PWD'];
  for (const varName of envVars) {
    const value = process.env[varName];
    if (value && existsSync(value)) {
      return resolve(value);
    }
  }
  
  // Priority 5: Search upward from process.cwd() for workspace markers
  const cwd = process.cwd();
  const foundRoot = findWorkspaceRoot(cwd);
  if (foundRoot) {
    return foundRoot;
  }
  
  // Priority 6: Fall back to process.cwd()
  return resolve(cwd);
}

/**
 * Resolve a path relative to workspace root.
 * If the path is already absolute, returns it as-is.
 * Otherwise, joins it with the workspace root.
 * 
 * @param filePath - Path to resolve (relative or absolute)
 * @param explicitRoot - Optional explicit workspace root
 * @returns Absolute path
 */
export function resolveWorkspacePath(filePath: string, explicitRoot?: string): string {
  if (require('path').isAbsolute(filePath)) {
    return filePath;
  }
  const workspaceRoot = getWorkspaceRoot(explicitRoot);
  return join(workspaceRoot, filePath);
}

/**
 * Check if a path exists relative to workspace root
 * 
 * @param filePath - Path to check (relative or absolute)
 * @param explicitRoot - Optional explicit workspace root
 * @returns True if path exists
 */
export function workspacePathExists(filePath: string, explicitRoot?: string): boolean {
  const absolutePath = resolveWorkspacePath(filePath, explicitRoot);
  return existsSync(absolutePath);
}

