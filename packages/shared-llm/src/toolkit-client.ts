/**
 * Robinson's Toolkit MCP Client
 * 
 * Shared client for connecting to Robinson's Toolkit MCP server.
 * All agents can use this to access 906 integration tools.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ToolkitCallParams {
  category: string;
  tool_name: string;
  arguments: Record<string, any>;
}

/**
 * Spawn Robinson's Toolkit MCP server using direct bin resolution
 * This avoids npx and PowerShell quirks on Windows
 */
function spawnToolkitMcp(extraEnv: Record<string, string | undefined> = {}): ChildProcess {
  // Resolve the package.json of the toolkit MCP from this package's context
  const require = createRequire(import.meta.url);
  let pkgJsonPath: string;

  try {
    pkgJsonPath = require.resolve('@robinson_ai_systems/robinsons-toolkit-mcp/package.json');
  } catch (err) {
    // Fallback: allow an env var to point to a built local path if needed
    const local = process.env.TOOLKIT_MCP_BIN;
    if (!local) throw new Error(
      `Cannot resolve @robinson_ai_systems/robinsons-toolkit-mcp. ` +
      `Install it or set TOOLKIT_MCP_BIN to a built entry file.`
    );
    const child = spawn(process.execPath, [local], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...extraEnv }
    });
    wireChildLogs(child, 'toolkit');
    return child;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as {
    bin?: string | Record<string, string>;
  };
  const binRel =
    typeof pkg.bin === 'string'
      ? pkg.bin
      : pkg.bin?.['robinsons-toolkit-mcp'] || (pkg.bin && Object.values(pkg.bin)[0]);

  if (!binRel) {
    throw new Error('robinsons-toolkit-mcp package.json has no "bin" field.');
  }

  const entry = path.join(path.dirname(pkgJsonPath), binRel);

  // Launch with Node so we bypass npx/PowerShell quirks
  const child = spawn(process.execPath, [entry], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      // Helpful defaults; tweak as you like
      MCP_LOG_LEVEL: process.env.MCP_LOG_LEVEL ?? 'debug',
      NODE_NO_WARNINGS: '1',
      ...extraEnv
    }
  });

  wireChildLogs(child, 'toolkit');
  return child;
}

/**
 * Wire child process logs to console
 */
function wireChildLogs(child: ChildProcess, tag: string): void {
  child.stdout?.on('data', (b) => {
    const s = b.toString();
    if (s.trim()) console.log(`[${tag}:stdout] ${s.trim()}`);
  });
  child.stderr?.on('data', (b) => {
    const s = b.toString();
    if (s.trim()) console.error(`[${tag}:stderr] ${s.trim()}`);
  });
  child.on('exit', (code) => {
    console.error(`[${tag}] exited with code ${code}`);
  });
}

/**
 * List tools with retry logic to handle async broker registration
 * Waits for the MCP server to be ready before returning tools
 */
async function listToolsWithRetry(
  client: { listTools: () => Promise<any> },
  retries = 10,
  delayMs = 300
): Promise<any> {
  console.error(`[listToolsWithRetry] Starting with ${retries} retries, ${delayMs}ms delay`);
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      console.error(`[listToolsWithRetry] Attempt ${i + 1}/${retries}...`);
      const res = await client.listTools();
      console.error(`[listToolsWithRetry] Got response with ${res?.tools?.length || 0} tools`);
      if (res?.tools && res.tools.length > 0) {
        console.error(`[listToolsWithRetry] Success! Returning ${res.tools.length} tools`);
        return res;
      }
      // If we got an empty array, give the broker time to register
      console.error(`[listToolsWithRetry] Empty response, waiting ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    } catch (e) {
      console.error(`[listToolsWithRetry] Error on attempt ${i + 1}:`, e);
      lastErr = e;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  // Final attempt throws if still empty
  console.error(`[listToolsWithRetry] All retries exhausted, making final attempt...`);
  const final = await client.listTools();
  console.error(`[listToolsWithRetry] Final attempt got ${final?.tools?.length || 0} tools`);
  if (!final?.tools?.length) {
    throw lastErr ?? new Error('No tools available after retries.');
  }
  return final;
}

export interface ToolkitCallResult {
  success: boolean;
  result?: any;
  error?: string;
}

export class ToolkitClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private process: ChildProcess | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;

  /**
   * Connect to Robinson's Toolkit MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return; // Already connected
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      await this.waitForConnection();
      return;
    }

    this.connecting = true;

    try {
      console.error('[ToolkitClient] Connecting to Robinson\'s Toolkit MCP...');

      // Spawn Robinson's Toolkit MCP server using direct bin resolution
      // Force stdio transport to ensure compatibility
      this.process = spawnToolkitMcp({ MCP_TRANSPORT: 'stdio' });

      // Handle process errors
      this.process.on('error', (error) => {
        console.error('[ToolkitClient] Process error:', error);
        this.connected = false;
      });

      this.process.on('exit', (code) => {
        console.error(`[ToolkitClient] Process exited with code ${code}`);
        this.connected = false;
      });

      // Create transport - use the resolved bin path
      const require = createRequire(import.meta.url);
      let binPath: string;

      try {
        const pkgJsonPath = require.resolve('@robinson_ai_systems/robinsons-toolkit-mcp/package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as {
          bin?: string | Record<string, string>;
        };
        const binRel =
          typeof pkg.bin === 'string'
            ? pkg.bin
            : pkg.bin?.['robinsons-toolkit-mcp'] || (pkg.bin && Object.values(pkg.bin)[0]);

        if (!binRel) {
          throw new Error('robinsons-toolkit-mcp package.json has no "bin" field.');
        }

        binPath = path.join(path.dirname(pkgJsonPath), binRel);
      } catch (err) {
        // Fallback to env var
        binPath = process.env.TOOLKIT_MCP_BIN || '';
        if (!binPath) {
          throw new Error('Cannot resolve Robinson\'s Toolkit MCP bin path');
        }
      }

      this.transport = new StdioClientTransport({
        command: process.execPath,
        args: [binPath],
        env: {
          ...process.env,
          MCP_TRANSPORT: 'stdio', // Force stdio transport
        },
      });

      // Create client
      this.client = new Client(
        {
          name: 'toolkit-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect
      await this.client.connect(this.transport);

      // Wait for tools to be available (handles async broker registration)
      console.error('[ToolkitClient] Waiting for tools to be available...');
      const toolsResult = await listToolsWithRetry(this.client);
      console.error(`[ToolkitClient] Got ${toolsResult.tools?.length || 0} tools from toolkit`);
      if (toolsResult.tools?.length > 0) {
        console.error(`[ToolkitClient] Tool names: ${toolsResult.tools.map((t: any) => t.name).join(', ')}`);
      }

      this.connected = true;
      this.connecting = false;

      console.error('[ToolkitClient] Connected successfully!');
    } catch (error: any) {
      this.connecting = false;
      this.connected = false;
      console.error('[ToolkitClient] Connection failed:', error.message);
      throw new Error(`Failed to connect to Robinson's Toolkit: ${error.message}`);
    }
  }

  /**
   * Wait for connection to complete
   */
  private async waitForConnection(maxWaitMs: number = 10000): Promise<void> {
    const startTime = Date.now();
    while (this.connecting && Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.connected) {
      throw new Error('Connection timeout');
    }
  }

  /**
   * Disconnect from Robinson's Toolkit
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    this.transport = null;
    this.connected = false;
    this.connecting = false;

    console.error('[ToolkitClient] Disconnected');
  }

  /**
   * Call a tool in Robinson's Toolkit
   */
  async callTool(params: ToolkitCallParams): Promise<ToolkitCallResult> {
    // Ensure connected
    if (!this.connected) {
      await this.connect();
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Client not initialized',
      };
    }

    try {
      console.error(`[ToolkitClient] Calling ${params.category}/${params.tool_name}...`);

      // Call toolkit_call broker tool
      const result = await this.client.callTool({
        name: 'toolkit_call_robinsons-toolkit-mcp',
        arguments: {
          category: params.category,
          tool_name: params.tool_name,
          arguments: params.arguments,
        },
      });

      console.error(`[ToolkitClient] Call successful`);

      return {
        success: true,
        result: result.content,
      };
    } catch (error: any) {
      console.error(`[ToolkitClient] Call failed:`, error.message);

      // Try to reconnect on connection errors
      if (error.message?.includes('connection') || error.message?.includes('closed')) {
        console.error('[ToolkitClient] Connection lost, attempting to reconnect...');
        this.connected = false;
        await this.connect();

        // Retry the call once
        try {
          const result = await this.client!.callTool({
            name: 'toolkit_call_robinsons-toolkit-mcp',
            arguments: {
              category: params.category,
              tool_name: params.tool_name,
              arguments: params.arguments,
            },
          });

          return {
            success: true,
            result: result.content,
          };
        } catch (retryError: any) {
          return {
            success: false,
            error: retryError.message,
          };
        }
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List available categories
   */
  async listCategories(): Promise<ToolkitCallResult> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Client not initialized',
      };
    }

    try {
      const result = await this.client.callTool({
        name: 'toolkit_list_categories_robinsons-toolkit-mcp',
        arguments: {},
      });

      return {
        success: true,
        result: result.content,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List tools in a category
   */
  async listTools(category: string): Promise<ToolkitCallResult> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Client not initialized',
      };
    }

    try {
      const result = await this.client.callTool({
        name: 'toolkit_list_tools_robinsons-toolkit-mcp',
        arguments: { category },
      });

      return {
        success: true,
        result: result.content,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Discover tools by query
   */
  async discoverTools(query: string, limit: number = 10): Promise<ToolkitCallResult> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Client not initialized',
      };
    }

    try {
      const result = await this.client.callTool({
        name: 'toolkit_discover_robinsons-toolkit-mcp',
        arguments: { query, limit },
      });

      return {
        success: true,
        result: result.content,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Shared singleton instance
 */
let sharedToolkitClient: ToolkitClient | null = null;

/**
 * Get shared toolkit client instance
 */
export function getSharedToolkitClient(): ToolkitClient {
  if (!sharedToolkitClient) {
    sharedToolkitClient = new ToolkitClient();
  }
  return sharedToolkitClient;
}

/**
 * Cleanup shared client on process exit
 */
process.on('exit', () => {
  if (sharedToolkitClient) {
    sharedToolkitClient.disconnect().catch(console.error);
  }
});

