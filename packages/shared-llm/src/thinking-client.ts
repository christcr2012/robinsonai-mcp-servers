/**
 * Thinking Tools MCP Client
 * 
 * Shared client for connecting to Thinking Tools MCP server.
 * All agents can use this to access 64 cognitive framework tools.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';

export interface ThinkingToolCallParams {
  tool_name: string;
  arguments: Record<string, any>;
}

export interface ThinkingToolCallResult {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Thinking Tools MCP Client
 */
export class ThinkingClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private process: ChildProcess | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;

  /**
   * Connect to Thinking Tools MCP
   */
  async connect(): Promise<void> {
    if (this.connected || this.connecting) {
      return;
    }

    this.connecting = true;

    try {
      console.error('[ThinkingClient] Connecting to Thinking Tools MCP...');

      // Spawn Thinking Tools MCP server
      this.process = spawn('npx', ['thinking-tools-mcp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      // Handle process errors
      this.process.on('error', (error) => {
        console.error('[ThinkingClient] Process error:', error);
        this.connected = false;
      });

      this.process.on('exit', (code) => {
        console.error(`[ThinkingClient] Process exited with code ${code}`);
        this.connected = false;
      });

      // Create transport
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['thinking-tools-mcp'],
      });

      // Create client
      this.client = new Client(
        {
          name: 'thinking-client',
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

      console.error('[ThinkingClient] Connected successfully');
    } catch (error: any) {
      this.connecting = false;
      this.connected = false;
      console.error('[ThinkingClient] Connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from Thinking Tools
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

    console.error('[ThinkingClient] Disconnected');
  }

  /**
   * Call a thinking tool
   */
  async callTool(params: ThinkingToolCallParams): Promise<ThinkingToolCallResult> {
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
      console.error(`[ThinkingClient] Calling ${params.tool_name}...`);

      // Call the thinking tool directly
      const result = await this.client.callTool({
        name: params.tool_name,
        arguments: params.arguments,
      });

      console.error(`[ThinkingClient] Call successful`);

      return {
        success: true,
        result: result.content,
      };
    } catch (error: any) {
      console.error(`[ThinkingClient] Call failed:`, error.message);

      // Try to reconnect on connection errors
      if (error.message?.includes('connection') || error.message?.includes('closed')) {
        console.error('[ThinkingClient] Connection lost, attempting to reconnect...');
        this.connected = false;
        await this.connect();

        // Retry the call once
        try {
          const result = await this.client!.callTool({
            name: params.tool_name,
            arguments: params.arguments,
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
   * List all available thinking tools
   */
  async listTools(): Promise<ThinkingToolCallResult> {
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
      const result = await this.client.listTools();

      return {
        success: true,
        result: result.tools,
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
let sharedThinkingClient: ThinkingClient | null = null;

/**
 * Get shared thinking client instance
 */
export function getSharedThinkingClient(): ThinkingClient {
  if (!sharedThinkingClient) {
    sharedThinkingClient = new ThinkingClient();
  }
  return sharedThinkingClient;
}

/**
 * Cleanup shared client on process exit
 */
process.on('exit', () => {
  if (sharedThinkingClient) {
    sharedThinkingClient.disconnect().catch(console.error);
  }
});

