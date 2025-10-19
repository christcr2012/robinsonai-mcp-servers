#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient, RedisClientType } from "redis";

// Types
interface RedisConfig {
  url: string;
  database?: number;
}

interface ToolResponse {
  content: Array<{ type: string; text: string }>;
}

class RobinsonAIRedisMCP {
  private server: Server;
  private client: RedisClientType | null = null;
  private config: RedisConfig;
  private currentDb: "provider" | "tenant" = "provider";

  constructor() {
    this.server = new Server(
      {
        name: "@robinsonai/redis-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Get Redis URL from command line args
    const redisUrl = process.argv[2];
    if (!redisUrl) {
      console.error("Usage: @robinsonai/redis-mcp <redis-url>");
      process.exit(1);
    }

    this.config = { url: redisUrl };
    this.setupHandlers();
  }

  private async connect(): Promise<void> {
    if (this.client?.isOpen) {
      return;
    }

    this.client = createClient({ url: this.config.url });
    this.client.on("error", (err) => console.error("Redis Client Error", err));
    await this.client.connect();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Basic Operations
        {
          name: "redis_get",
          description: "Get value by key from Redis",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key to retrieve" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_set",
          description: "Set a Redis key-value pair with optional TTL",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
              value: { type: "string", description: "Value to store" },
              ttl: { type: "number", description: "TTL in seconds (optional)" },
            },
            required: ["key", "value"],
          },
        },
        {
          name: "redis_delete",
          description: "Delete one or more keys from Redis",
          inputSchema: {
            type: "object",
            properties: {
              keys: {
                type: "array",
                items: { type: "string" },
                description: "Key or array of keys to delete",
              },
            },
            required: ["keys"],
          },
        },
        {
          name: "redis_exists",
          description: "Check if key(s) exist in Redis",
          inputSchema: {
            type: "object",
            properties: {
              keys: {
                type: "array",
                items: { type: "string" },
                description: "Keys to check",
              },
            },
            required: ["keys"],
          },
        },
        {
          name: "redis_ttl",
          description: "Get TTL (time to live) for a key in seconds",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_expire",
          description: "Set expiration time for a key",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
              seconds: { type: "number", description: "Expiration time in seconds" },
            },
            required: ["key", "seconds"],
          },
        },

        // Pattern Operations
        {
          name: "redis_list_keys",
          description: "List Redis keys matching a pattern (use * for wildcard)",
          inputSchema: {
            type: "object",
            properties: {
              pattern: {
                type: "string",
                description: "Pattern to match keys (default: *)",
                default: "*",
              },
              limit: {
                type: "number",
                description: "Maximum number of keys to return (default: 100)",
                default: 100,
              },
            },
          },
        },
        {
          name: "redis_delete_by_pattern",
          description: "Delete all keys matching a pattern (DANGEROUS - use with caution)",
          inputSchema: {
            type: "object",
            properties: {
              pattern: { type: "string", description: "Pattern to match keys" },
              confirm: {
                type: "boolean",
                description: "Must be true to confirm deletion",
              },
            },
            required: ["pattern", "confirm"],
          },
        },

        // Bulk Operations
        {
          name: "redis_mget",
          description: "Get multiple values by keys",
          inputSchema: {
            type: "object",
            properties: {
              keys: {
                type: "array",
                items: { type: "string" },
                description: "Array of keys to retrieve",
              },
            },
            required: ["keys"],
          },
        },

        // Cache Analytics
        {
          name: "redis_info",
          description: "Get Redis server information and statistics",
          inputSchema: {
            type: "object",
            properties: {
              section: {
                type: "string",
                description: "Info section (server, memory, stats, etc.)",
              },
            },
          },
        },
        {
          name: "redis_dbsize",
          description: "Get total number of keys in current database",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "redis_memory_usage",
          description: "Get memory usage for a specific key",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
            },
            required: ["key"],
          },
        },

        // Application-Specific Operations
        {
          name: "redis_list_sessions",
          description: "List all active sessions (keys matching session:*)",
          inputSchema: {
            type: "object",
            properties: {
              tenant_id: {
                type: "string",
                description: "Filter by tenant ID (optional)",
              },
              limit: { type: "number", default: 50 },
            },
          },
        },
        {
          name: "redis_inspect_session",
          description: "Get detailed information about a session",
          inputSchema: {
            type: "object",
            properties: {
              session_id: { type: "string", description: "Session ID" },
            },
            required: ["session_id"],
          },
        },
        {
          name: "redis_clear_tenant_cache",
          description: "Clear all cache entries for a specific tenant",
          inputSchema: {
            type: "object",
            properties: {
              tenant_id: { type: "string", description: "Tenant ID" },
              confirm: { type: "boolean", description: "Must be true to confirm" },
            },
            required: ["tenant_id", "confirm"],
          },
        },
        {
          name: "redis_list_rate_limits",
          description: "List all rate limit entries",
          inputSchema: {
            type: "object",
            properties: {
              user_id: { type: "string", description: "Filter by user ID (optional)" },
              limit: { type: "number", default: 50 },
            },
          },
        },

        // Database Switching
        {
          name: "redis_current_db",
          description: "Show current database context (provider or tenant)",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "redis_flush_db",
          description: "Clear all keys in current database (DANGEROUS)",
          inputSchema: {
            type: "object",
            properties: {
              confirm: {
                type: "boolean",
                description: "Must be true to confirm flush",
              },
            },
            required: ["confirm"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.connect();

      try {
        switch (request.params.name) {
          case "redis_get":
            return await this.handleGet(request.params.arguments);
          case "redis_set":
            return await this.handleSet(request.params.arguments);
          case "redis_delete":
            return await this.handleDelete(request.params.arguments);
          case "redis_exists":
            return await this.handleExists(request.params.arguments);
          case "redis_ttl":
            return await this.handleTTL(request.params.arguments);
          case "redis_expire":
            return await this.handleExpire(request.params.arguments);
          case "redis_list_keys":
            return await this.handleListKeys(request.params.arguments);
          case "redis_delete_by_pattern":
            return await this.handleDeleteByPattern(request.params.arguments);
          case "redis_mget":
            return await this.handleMGet(request.params.arguments);
          case "redis_info":
            return await this.handleInfo(request.params.arguments);
          case "redis_dbsize":
            return await this.handleDBSize();
          case "redis_memory_usage":
            return await this.handleMemoryUsage(request.params.arguments);
          case "redis_list_sessions":
            return await this.handleListSessions(request.params.arguments);
          case "redis_inspect_session":
            return await this.handleInspectSession(request.params.arguments);
          case "redis_clear_tenant_cache":
            return await this.handleClearTenantCache(request.params.arguments);
          case "redis_list_rate_limits":
            return await this.handleListRateLimits(request.params.arguments);
          case "redis_current_db":
            return await this.handleCurrentDB();
          case "redis_flush_db":
            return await this.handleFlushDB(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error: ${errorMessage}` }],
        };
      }
    });
  }

  // Tool Handlers
  private async handleGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await this.client!.get(args.key);
    return {
      content: [
        {
          type: "text",
          text: value !== null ? value : `Key "${args.key}" not found`,
        },
      ],
    };
  }

  private async handleSet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (args.ttl) {
      await this.client!.setEx(args.key, args.ttl, args.value);
    } else {
      await this.client!.set(args.key, args.value);
    }
    return {
      content: [
        {
          type: "text",
          text: `Set ${args.key}${args.ttl ? ` with TTL ${args.ttl}s` : ""}`,
        },
      ],
    };
  }

  private async handleDelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.del(args.keys);
    return {
      content: [{ type: "text", text: `Deleted ${count} key(s)` }],
    };
  }

  private async handleExists(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.exists(args.keys);
    return {
      content: [
        {
          type: "text",
          text: `${count} of ${args.keys.length} key(s) exist`,
        },
      ],
    };
  }

  private async handleTTL(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const ttl = await this.client!.ttl(args.key);
    let message: string;
    if (ttl === -2) message = `Key "${args.key}" does not exist`;
    else if (ttl === -1) message = `Key "${args.key}" has no expiration`;
    else message = `TTL: ${ttl} seconds`;

    return { content: [{ type: "text", text: message }] };
  }

  private async handleExpire(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.client!.expire(args.key, args.seconds);
    return {
      content: [
        {
          type: "text",
          text: result
            ? `Set expiration for ${args.key} to ${args.seconds}s`
            : `Key "${args.key}" not found`,
        },
      ],
    };
  }

  private async handleListKeys(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const pattern = args.pattern || "*";
    const limit = args.limit || 100;
    const keys: string[] = [];

    for await (const key of this.client!.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      keys.push(key);
      if (keys.length >= limit) break;
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${keys.length} key(s):\n${keys.join("\n")}`,
        },
      ],
    };
  }

  private async handleDeleteByPattern(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (!args.confirm) {
      return {
        content: [
          {
            type: "text",
            text: "Deletion cancelled. Set confirm=true to proceed.",
          },
        ],
      };
    }

    const keys: string[] = [];
    for await (const key of this.client!.scanIterator({
      MATCH: args.pattern,
      COUNT: 100,
    })) {
      keys.push(key);
    }

    if (keys.length === 0) {
      return {
        content: [
          { type: "text", text: `No keys found matching pattern "${args.pattern}"` },
        ],
      };
    }

    const count = await this.client!.del(keys);
    return {
      content: [
        {
          type: "text",
          text: `Deleted ${count} key(s) matching pattern "${args.pattern}"`,
        },
      ],
    };
  }

  private async handleMGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const values = await this.client!.mGet(args.keys);
    const results = args.keys.map((key: string, i: number) => ({
      key,
      value: values[i],
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  private async handleInfo(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const info = await this.client!.info(args.section);
    return { content: [{ type: "text", text: info }] };
  }

  private async handleDBSize(): Promise<{ content: Array<{ type: string; text: string }> }> {
    const size = await this.client!.dbSize();
    return {
      content: [{ type: "text", text: `Database contains ${size} keys` }],
    };
  }

  private async handleMemoryUsage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const memory = await this.client!.memoryUsage(args.key);
    return {
      content: [
        {
          type: "text",
          text: memory
            ? `Memory usage: ${memory} bytes`
            : `Key "${args.key}" not found`,
        },
      ],
    };
  }

  private async handleListSessions(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const pattern = args.tenant_id
      ? `session:${args.tenant_id}:*`
      : "session:*";
    const limit = args.limit || 50;
    const sessions: string[] = [];

    for await (const key of this.client!.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      sessions.push(key);
      if (sessions.length >= limit) break;
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${sessions.length} session(s):\n${sessions.join("\n")}`,
        },
      ],
    };
  }

  private async handleInspectSession(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const key = args.session_id.startsWith("session:")
      ? args.session_id
      : `session:${args.session_id}`;
    const value = await this.client!.get(key);
    const ttl = await this.client!.ttl(key);

    if (!value) {
      return {
        content: [{ type: "text", text: `Session "${args.session_id}" not found` }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Session: ${key}\nTTL: ${ttl}s\nData:\n${value}`,
        },
      ],
    };
  }

  private async handleClearTenantCache(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (!args.confirm) {
      return {
        content: [
          {
            type: "text",
            text: "Cache clear cancelled. Set confirm=true to proceed.",
          },
        ],
      };
    }

    const pattern = `*:${args.tenant_id}:*`;
    const keys: string[] = [];

    for await (const key of this.client!.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      keys.push(key);
    }

    if (keys.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No cache entries found for tenant "${args.tenant_id}"`,
          },
        ],
      };
    }

    const count = await this.client!.del(keys);
    return {
      content: [
        {
          type: "text",
          text: `Cleared ${count} cache entries for tenant "${args.tenant_id}"`,
        },
      ],
    };
  }

  private async handleListRateLimits(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const pattern = args.user_id
      ? `ratelimit:${args.user_id}:*`
      : "ratelimit:*";
    const limit = args.limit || 50;
    const rateLimits: string[] = [];

    for await (const key of this.client!.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      rateLimits.push(key);
      if (rateLimits.length >= limit) break;
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${rateLimits.length} rate limit(s):\n${rateLimits.join("\n")}`,
        },
      ],
    };
  }

  private async handleCurrentDB(): Promise<{ content: Array<{ type: string; text: string }> }> {
    return {
      content: [
        {
          type: "text",
          text: `Current database: ${this.currentDb}\nConnection: ${this.config.url}`,
        },
      ],
    };
  }

  private async handleFlushDB(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (!args.confirm) {
      return {
        content: [
          {
            type: "text",
            text: "Flush cancelled. Set confirm=true to proceed. WARNING: This will delete ALL keys!",
          },
        ],
      };
    }

    await this.client!.flushDb();
    return {
      content: [
        { type: "text", text: "Database flushed. All keys have been deleted." },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("@robinsonai/redis-mcp server running on stdio");
  }
}

const server = new RobinsonAIRedisMCP();
server.run().catch(console.error);
