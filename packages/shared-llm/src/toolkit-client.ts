/**
 * Robinson's Toolkit MCP Client
 * 
 * Shared client for connecting to Robinson's Toolkit MCP server.
 * All agents can use this to access 906 integration tools.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';

export interface ToolkitCallParams {
  category: string;
  tool_name: string;
  arguments: Record<string, any>;
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

      // Spawn Robinson's Toolkit MCP server
      this.process = spawn('npx', ['robinsons-toolkit-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      // Handle process errors
      this.process.on('error', (error) => {
        console.error('[ToolkitClient] Process error:', error);
        this.connected = false;
      });

      this.process.on('exit', (code) => {
        console.error(`[ToolkitClient] Process exited with code ${code}`);
        this.connected = false;
      });

      // Create transport
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['robinsons-toolkit-mcp'],
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

