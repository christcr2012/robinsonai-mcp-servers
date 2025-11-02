/**
 * Context CLI Tools - Integration with global robinson-context CLI
 * 
 * Provides MCP tools that call the global robinson-context command
 * for repo-agnostic context auditing.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Run robinson-context CLI command
 */
async function runContextCLI(args: string[] = []): Promise<any> {
  try {
    const { stdout, stderr } = await execFileAsync('robinson-context', args, {
      cwd: process.cwd(),
      timeout: 120000, // 2 minutes
    });
    
    if (stderr) {
      console.error('robinson-context stderr:', stderr);
    }
    
    try {
      return JSON.parse(stdout);
    } catch {
      return { stdout, stderr };
    }
  } catch (error: any) {
    throw new Error(`robinson-context failed: ${error.message}`);
  }
}

/**
 * Context CLI MCP Tools
 */
export const contextCLITools = [
  {
    name: 'context_preview',
    description: 'Preview files that will be included in context audit. Shows total files found, files after filtering, and a sample of file paths. Use this before running a full audit to verify the scope.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    handler: async () => {
      return await runContextCLI(['preview']);
    },
  },
  {
    name: 'context_audit',
    description: 'Run full context audit on the current repository. Scans all files (respecting .gitignore and .contextignore), detects TODOs, placeholders, not-implemented stubs, and extracts claims from documentation. Writes reports to ./reports/ directory.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    handler: async () => {
      return await runContextCLI(['audit']);
    },
  },
];

