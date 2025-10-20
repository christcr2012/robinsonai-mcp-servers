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

        // String Operations
        {
          name: "redis_incr",
          description: "Increment the integer value of a key by 1",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_decr",
          description: "Decrement the integer value of a key by 1",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_incrby",
          description: "Increment the integer value of a key by a specific amount",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
              increment: { type: "number", description: "Amount to increment by" },
            },
            required: ["key", "increment"],
          },
        },
        {
          name: "redis_decrby",
          description: "Decrement the integer value of a key by a specific amount",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
              decrement: { type: "number", description: "Amount to decrement by" },
            },
            required: ["key", "decrement"],
          },
        },
        {
          name: "redis_append",
          description: "Append a value to a key",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
              value: { type: "string", description: "Value to append" },
            },
            required: ["key", "value"],
          },
        },
        {
          name: "redis_strlen",
          description: "Get the length of the value stored in a key",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
            },
            required: ["key"],
          },
        },

        // Hash Operations
        {
          name: "redis_hset",
          description: "Set field in a hash",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Hash key" },
              field: { type: "string", description: "Field name" },
              value: { type: "string", description: "Field value" },
            },
            required: ["key", "field", "value"],
          },
        },
        {
          name: "redis_hget",
          description: "Get field value from a hash",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Hash key" },
              field: { type: "string", description: "Field name" },
            },
            required: ["key", "field"],
          },
        },
        {
          name: "redis_hgetall",
          description: "Get all fields and values from a hash",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Hash key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_hdel",
          description: "Delete one or more hash fields",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Hash key" },
              fields: {
                type: "array",
                items: { type: "string" },
                description: "Field names to delete",
              },
            },
            required: ["key", "fields"],
          },
        },
        {
          name: "redis_hexists",
          description: "Check if a hash field exists",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Hash key" },
              field: { type: "string", description: "Field name" },
            },
            required: ["key", "field"],
          },
        },
        {
          name: "redis_hkeys",
          description: "Get all field names in a hash",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Hash key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_hvals",
          description: "Get all values in a hash",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Hash key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_hlen",
          description: "Get the number of fields in a hash",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Hash key" },
            },
            required: ["key"],
          },
        },

        // List Operations
        {
          name: "redis_lpush",
          description: "Prepend one or multiple values to a list",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "List key" },
              values: {
                type: "array",
                items: { type: "string" },
                description: "Values to prepend",
              },
            },
            required: ["key", "values"],
          },
        },
        {
          name: "redis_rpush",
          description: "Append one or multiple values to a list",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "List key" },
              values: {
                type: "array",
                items: { type: "string" },
                description: "Values to append",
              },
            },
            required: ["key", "values"],
          },
        },
        {
          name: "redis_lpop",
          description: "Remove and get the first element in a list",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "List key" },
              count: { type: "number", description: "Number of elements to pop (optional)" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_rpop",
          description: "Remove and get the last element in a list",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "List key" },
              count: { type: "number", description: "Number of elements to pop (optional)" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_lrange",
          description: "Get a range of elements from a list",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "List key" },
              start: { type: "number", description: "Start index" },
              stop: { type: "number", description: "Stop index" },
            },
            required: ["key", "start", "stop"],
          },
        },
        {
          name: "redis_llen",
          description: "Get the length of a list",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "List key" },
            },
            required: ["key"],
          },
        },

        // Set Operations
        {
          name: "redis_sadd",
          description: "Add one or more members to a set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Set key" },
              members: {
                type: "array",
                items: { type: "string" },
                description: "Members to add",
              },
            },
            required: ["key", "members"],
          },
        },
        {
          name: "redis_smembers",
          description: "Get all members of a set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Set key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_srem",
          description: "Remove one or more members from a set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Set key" },
              members: {
                type: "array",
                items: { type: "string" },
                description: "Members to remove",
              },
            },
            required: ["key", "members"],
          },
        },
        {
          name: "redis_sismember",
          description: "Check if a value is a member of a set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Set key" },
              member: { type: "string", description: "Member to check" },
            },
            required: ["key", "member"],
          },
        },
        {
          name: "redis_scard",
          description: "Get the number of members in a set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Set key" },
            },
            required: ["key"],
          },
        },

        // Sorted Set Operations
        {
          name: "redis_zadd",
          description: "Add one or more members to a sorted set with scores",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
              members: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    score: { type: "number" },
                    value: { type: "string" },
                  },
                },
                description: "Array of {score, value} objects",
              },
            },
            required: ["key", "members"],
          },
        },
        {
          name: "redis_zrange",
          description: "Get a range of members from a sorted set by index",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
              start: { type: "number", description: "Start index" },
              stop: { type: "number", description: "Stop index" },
              withScores: { type: "boolean", description: "Include scores in result" },
            },
            required: ["key", "start", "stop"],
          },
        },
        {
          name: "redis_zrem",
          description: "Remove one or more members from a sorted set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
              members: {
                type: "array",
                items: { type: "string" },
                description: "Members to remove",
              },
            },
            required: ["key", "members"],
          },
        },
        {
          name: "redis_zscore",
          description: "Get the score of a member in a sorted set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
              member: { type: "string", description: "Member to get score for" },
            },
            required: ["key", "member"],
          },
        },
        {
          name: "redis_zcard",
          description: "Get the number of members in a sorted set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_zrank",
          description: "Get the rank of a member in a sorted set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
              member: { type: "string", description: "Member to get rank for" },
            },
            required: ["key", "member"],
          },
        },

        // Key Inspection
        {
          name: "redis_type",
          description: "Get the type of a key (string, list, set, zset, hash)",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_rename",
          description: "Rename a key",
          inputSchema: {
            type: "object",
            properties: {
              oldKey: { type: "string", description: "Current key name" },
              newKey: { type: "string", description: "New key name" },
            },
            required: ["oldKey", "newKey"],
          },
        },
        {
          name: "redis_persist",
          description: "Remove the expiration from a key",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Redis key" },
            },
            required: ["key"],
          },
        },

        // Pub/Sub Operations
        {
          name: "redis_publish",
          description: "Publish a message to a channel",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string", description: "Channel name" },
              message: { type: "string", description: "Message to publish" },
            },
            required: ["channel", "message"],
          },
        },
        {
          name: "redis_xadd",
          description: "Add entry to a stream",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Stream key" },
              id: { type: "string", description: "Entry ID (* for auto-generate)" },
              fields: { type: "object", description: "Field-value pairs" },
            },
            required: ["key", "id", "fields"],
          },
        },
        {
          name: "redis_xread",
          description: "Read entries from one or more streams",
          inputSchema: {
            type: "object",
            properties: {
              streams: { type: "object", description: "Stream keys and IDs" },
              count: { type: "number", description: "Max entries to return" },
              block: { type: "number", description: "Block for milliseconds" },
            },
            required: ["streams"],
          },
        },
        {
          name: "redis_xrange",
          description: "Get range of entries from a stream",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Stream key" },
              start: { type: "string", description: "Start ID (- for min)" },
              end: { type: "string", description: "End ID (+ for max)" },
              count: { type: "number", description: "Max entries" },
            },
            required: ["key", "start", "end"],
          },
        },
        {
          name: "redis_xlen",
          description: "Get the length of a stream",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Stream key" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_geoadd",
          description: "Add geospatial items (longitude, latitude, member)",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Geo key" },
              members: { type: "array", description: "Array of [lng, lat, name]" },
            },
            required: ["key", "members"],
          },
        },
        {
          name: "redis_geodist",
          description: "Get distance between two members",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Geo key" },
              member1: { type: "string", description: "First member" },
              member2: { type: "string", description: "Second member" },
              unit: { type: "string", description: "Unit (m, km, mi, ft)" },
            },
            required: ["key", "member1", "member2"],
          },
        },
        {
          name: "redis_georadius",
          description: "Query members within radius",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Geo key" },
              longitude: { type: "number", description: "Center longitude" },
              latitude: { type: "number", description: "Center latitude" },
              radius: { type: "number", description: "Radius" },
              unit: { type: "string", description: "Unit (m, km, mi, ft)" },
            },
            required: ["key", "longitude", "latitude", "radius", "unit"],
          },
        },
        {
          name: "redis_pfadd",
          description: "Add elements to HyperLogLog",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "HyperLogLog key" },
              elements: { type: "array", description: "Elements to add" },
            },
            required: ["key", "elements"],
          },
        },
        {
          name: "redis_pfcount",
          description: "Get cardinality of HyperLogLog",
          inputSchema: {
            type: "object",
            properties: {
              keys: { type: "array", description: "HyperLogLog keys" },
            },
            required: ["keys"],
          },
        },
        {
          name: "redis_setbit",
          description: "Set or clear bit at offset",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key" },
              offset: { type: "number", description: "Bit offset" },
              value: { type: "number", description: "0 or 1" },
            },
            required: ["key", "offset", "value"],
          },
        },
        {
          name: "redis_getbit",
          description: "Get bit value at offset",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key" },
              offset: { type: "number", description: "Bit offset" },
            },
            required: ["key", "offset"],
          },
        },
        {
          name: "redis_bitcount",
          description: "Count set bits in a string",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key" },
              start: { type: "number", description: "Start byte" },
              end: { type: "number", description: "End byte" },
            },
            required: ["key"],
          },
        },
        {
          name: "redis_zrangebyscore",
          description: "Get members in sorted set by score range",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
              min: { type: "string", description: "Min score" },
              max: { type: "string", description: "Max score" },
              withscores: { type: "boolean", description: "Include scores" },
            },
            required: ["key", "min", "max"],
          },
        },
        {
          name: "redis_zincrby",
          description: "Increment score of member in sorted set",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
              increment: { type: "number", description: "Increment amount" },
              member: { type: "string", description: "Member" },
            },
            required: ["key", "increment", "member"],
          },
        },
        {
          name: "redis_zcount",
          description: "Count members in score range",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
              min: { type: "string", description: "Min score" },
              max: { type: "string", description: "Max score" },
            },
            required: ["key", "min", "max"],
          },
        },
        {
          name: "redis_scan",
          description: "Incrementally iterate keys",
          inputSchema: {
            type: "object",
            properties: {
              cursor: { type: "string", description: "Cursor (0 to start)" },
              match: { type: "string", description: "Pattern to match" },
              count: { type: "number", description: "Hint for count" },
            },
            required: ["cursor"],
          },
        },
        {
          name: "redis_hscan",
          description: "Incrementally iterate hash fields",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Hash key" },
              cursor: { type: "string", description: "Cursor" },
              match: { type: "string", description: "Pattern" },
              count: { type: "number", description: "Count hint" },
            },
            required: ["key", "cursor"],
          },
        },
        {
          name: "redis_sscan",
          description: "Incrementally iterate set members",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Set key" },
              cursor: { type: "string", description: "Cursor" },
              match: { type: "string", description: "Pattern" },
              count: { type: "number", description: "Count hint" },
            },
            required: ["key", "cursor"],
          },
        },
        {
          name: "redis_zscan",
          description: "Incrementally iterate sorted set members",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Sorted set key" },
              cursor: { type: "string", description: "Cursor" },
              match: { type: "string", description: "Pattern" },
              count: { type: "number", description: "Count hint" },
            },
            required: ["key", "cursor"],
          },
        },
        {
          name: "redis_getrange",
          description: "Get substring of string value",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key" },
              start: { type: "number", description: "Start offset" },
              end: { type: "number", description: "End offset" },
            },
            required: ["key", "start", "end"],
          },
        },
        {
          name: "redis_setrange",
          description: "Overwrite part of string at offset",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key" },
              offset: { type: "number", description: "Offset" },
              value: { type: "string", description: "Value" },
            },
            required: ["key", "offset", "value"],
          },
        },
        {
          name: "redis_sinter",
          description: "Intersect multiple sets",
          inputSchema: {
            type: "object",
            properties: {
              keys: { type: "array", description: "Set keys" },
            },
            required: ["keys"],
          },
        },
        {
          name: "redis_sunion",
          description: "Union multiple sets",
          inputSchema: {
            type: "object",
            properties: {
              keys: { type: "array", description: "Set keys" },
            },
            required: ["keys"],
          },
        },
        {
          name: "redis_sdiff",
          description: "Difference of sets",
          inputSchema: {
            type: "object",
            properties: {
              keys: { type: "array", description: "Set keys" },
            },
            required: ["keys"],
          },
        },
        {
          name: "redis_zunionstore",
          description: "Union sorted sets and store result",
          inputSchema: {
            type: "object",
            properties: {
              destination: { type: "string", description: "Destination key" },
              keys: { type: "array", description: "Source keys" },
              weights: { type: "array", description: "Weights" },
            },
            required: ["destination", "keys"],
          },
        },
        {
          name: "redis_zinterstore",
          description: "Intersect sorted sets and store result",
          inputSchema: {
            type: "object",
            properties: {
              destination: { type: "string", description: "Destination key" },
              keys: { type: "array", description: "Source keys" },
              weights: { type: "array", description: "Weights" },
            },
            required: ["destination", "keys"],
          },
        },
        {
          name: "redis_linsert",
          description: "Insert element before or after pivot in list",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "List key" },
              position: { type: "string", description: "BEFORE or AFTER" },
              pivot: { type: "string", description: "Pivot element" },
              element: { type: "string", description: "Element to insert" },
            },
            required: ["key", "position", "pivot", "element"],
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

          // String Operations
          case "redis_incr":
            return await this.handleIncr(request.params.arguments);
          case "redis_decr":
            return await this.handleDecr(request.params.arguments);
          case "redis_incrby":
            return await this.handleIncrBy(request.params.arguments);
          case "redis_decrby":
            return await this.handleDecrBy(request.params.arguments);
          case "redis_append":
            return await this.handleAppend(request.params.arguments);
          case "redis_strlen":
            return await this.handleStrLen(request.params.arguments);

          // Hash Operations
          case "redis_hset":
            return await this.handleHSet(request.params.arguments);
          case "redis_hget":
            return await this.handleHGet(request.params.arguments);
          case "redis_hgetall":
            return await this.handleHGetAll(request.params.arguments);
          case "redis_hdel":
            return await this.handleHDel(request.params.arguments);
          case "redis_hexists":
            return await this.handleHExists(request.params.arguments);
          case "redis_hkeys":
            return await this.handleHKeys(request.params.arguments);
          case "redis_hvals":
            return await this.handleHVals(request.params.arguments);
          case "redis_hlen":
            return await this.handleHLen(request.params.arguments);

          // List Operations
          case "redis_lpush":
            return await this.handleLPush(request.params.arguments);
          case "redis_rpush":
            return await this.handleRPush(request.params.arguments);
          case "redis_lpop":
            return await this.handleLPop(request.params.arguments);
          case "redis_rpop":
            return await this.handleRPop(request.params.arguments);
          case "redis_lrange":
            return await this.handleLRange(request.params.arguments);
          case "redis_llen":
            return await this.handleLLen(request.params.arguments);

          // Set Operations
          case "redis_sadd":
            return await this.handleSAdd(request.params.arguments);
          case "redis_smembers":
            return await this.handleSMembers(request.params.arguments);
          case "redis_srem":
            return await this.handleSRem(request.params.arguments);
          case "redis_sismember":
            return await this.handleSIsMember(request.params.arguments);
          case "redis_scard":
            return await this.handleSCard(request.params.arguments);

          // Sorted Set Operations
          case "redis_zadd":
            return await this.handleZAdd(request.params.arguments);
          case "redis_zrange":
            return await this.handleZRange(request.params.arguments);
          case "redis_zrem":
            return await this.handleZRem(request.params.arguments);
          case "redis_zscore":
            return await this.handleZScore(request.params.arguments);
          case "redis_zcard":
            return await this.handleZCard(request.params.arguments);
          case "redis_zrank":
            return await this.handleZRank(request.params.arguments);

          // Key Inspection
          case "redis_type":
            return await this.handleType(request.params.arguments);
          case "redis_rename":
            return await this.handleRename(request.params.arguments);
          case "redis_persist":
            return await this.handlePersist(request.params.arguments);

          // Streams
          case "redis_xadd":
            return await this.handleXAdd(request.params.arguments);
          case "redis_xread":
            return await this.handleXRead(request.params.arguments);
          case "redis_xrange":
            return await this.handleXRange(request.params.arguments);
          case "redis_xlen":
            return await this.handleXLen(request.params.arguments);

          // Geospatial
          case "redis_geoadd":
            return await this.handleGeoAdd(request.params.arguments);
          case "redis_geodist":
            return await this.handleGeoDist(request.params.arguments);
          case "redis_georadius":
            return await this.handleGeoRadius(request.params.arguments);

          // HyperLogLog
          case "redis_pfadd":
            return await this.handlePfAdd(request.params.arguments);
          case "redis_pfcount":
            return await this.handlePfCount(request.params.arguments);

          // Bitmaps
          case "redis_setbit":
            return await this.handleSetBit(request.params.arguments);
          case "redis_getbit":
            return await this.handleGetBit(request.params.arguments);
          case "redis_bitcount":
            return await this.handleBitCount(request.params.arguments);

          // Advanced Sorted Sets
          case "redis_zrangebyscore":
            return await this.handleZRangeByScore(request.params.arguments);
          case "redis_zincrby":
            return await this.handleZIncrBy(request.params.arguments);
          case "redis_zcount":
            return await this.handleZCount(request.params.arguments);

          // Scan operations
          case "redis_scan":
            return await this.handleScan(request.params.arguments);
          case "redis_hscan":
            return await this.handleHScan(request.params.arguments);
          case "redis_sscan":
            return await this.handleSScan(request.params.arguments);
          case "redis_zscan":
            return await this.handleZScan(request.params.arguments);

          // String range
          case "redis_getrange":
            return await this.handleGetRange(request.params.arguments);
          case "redis_setrange":
            return await this.handleSetRange(request.params.arguments);

          // Set operations
          case "redis_sinter":
            return await this.handleSInter(request.params.arguments);
          case "redis_sunion":
            return await this.handleSUnion(request.params.arguments);
          case "redis_sdiff":
            return await this.handleSDiff(request.params.arguments);

          // Sorted set store
          case "redis_zunionstore":
            return await this.handleZUnionStore(request.params.arguments);
          case "redis_zinterstore":
            return await this.handleZInterStore(request.params.arguments);

          // List insert
          case "redis_linsert":
            return await this.handleLInsert(request.params.arguments);

          // Pub/Sub
          case "redis_publish":
            return await this.handlePublish(request.params.arguments);

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

  // String Operations Handlers
  private async handleIncr(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await this.client!.incr(args.key);
    return { content: [{ type: "text", text: `Incremented ${args.key} to ${value}` }] };
  }

  private async handleDecr(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await this.client!.decr(args.key);
    return { content: [{ type: "text", text: `Decremented ${args.key} to ${value}` }] };
  }

  private async handleIncrBy(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await this.client!.incrBy(args.key, args.increment);
    return { content: [{ type: "text", text: `Incremented ${args.key} by ${args.increment} to ${value}` }] };
  }

  private async handleDecrBy(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await this.client!.decrBy(args.key, args.decrement);
    return { content: [{ type: "text", text: `Decremented ${args.key} by ${args.decrement} to ${value}` }] };
  }

  private async handleAppend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await this.client!.append(args.key, args.value);
    return { content: [{ type: "text", text: `Appended to ${args.key}, new length: ${length}` }] };
  }

  private async handleStrLen(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await this.client!.strLen(args.key);
    return { content: [{ type: "text", text: `Length of ${args.key}: ${length}` }] };
  }

  // Hash Operations Handlers
  private async handleHSet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.client!.hSet(args.key, args.field, args.value);
    return { content: [{ type: "text", text: `Set ${args.field} in hash ${args.key}` }] };
  }

  private async handleHGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await this.client!.hGet(args.key, args.field);
    return { content: [{ type: "text", text: value !== undefined ? value : `Field ${args.field} not found in ${args.key}` }] };
  }

  private async handleHGetAll(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const hash = await this.client!.hGetAll(args.key);
    return { content: [{ type: "text", text: JSON.stringify(hash, null, 2) }] };
  }

  private async handleHDel(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.hDel(args.key, args.fields);
    return { content: [{ type: "text", text: `Deleted ${count} field(s) from hash ${args.key}` }] };
  }

  private async handleHExists(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const exists = await this.client!.hExists(args.key, args.field);
    return { content: [{ type: "text", text: `Field ${args.field} ${exists ? 'exists' : 'does not exist'} in ${args.key}` }] };
  }

  private async handleHKeys(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const keys = await this.client!.hKeys(args.key);
    return { content: [{ type: "text", text: JSON.stringify(keys, null, 2) }] };
  }

  private async handleHVals(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const values = await this.client!.hVals(args.key);
    return { content: [{ type: "text", text: JSON.stringify(values, null, 2) }] };
  }

  private async handleHLen(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await this.client!.hLen(args.key);
    return { content: [{ type: "text", text: `Hash ${args.key} has ${length} field(s)` }] };
  }

  // List Operations Handlers
  private async handleLPush(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await this.client!.lPush(args.key, args.values);
    return { content: [{ type: "text", text: `Prepended ${args.values.length} value(s) to list ${args.key}, new length: ${length}` }] };
  }

  private async handleRPush(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await this.client!.rPush(args.key, args.values);
    return { content: [{ type: "text", text: `Appended ${args.values.length} value(s) to list ${args.key}, new length: ${length}` }] };
  }

  private async handleLPop(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = args.count ? await this.client!.lPop(args.key, args.count) : await this.client!.lPop(args.key);
    return { content: [{ type: "text", text: value ? JSON.stringify(value) : `List ${args.key} is empty` }] };
  }

  private async handleRPop(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = args.count ? await this.client!.rPop(args.key, args.count) : await this.client!.rPop(args.key);
    return { content: [{ type: "text", text: value ? JSON.stringify(value) : `List ${args.key} is empty` }] };
  }

  private async handleLRange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const values = await this.client!.lRange(args.key, args.start, args.stop);
    return { content: [{ type: "text", text: JSON.stringify(values, null, 2) }] };
  }

  private async handleLLen(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await this.client!.lLen(args.key);
    return { content: [{ type: "text", text: `List ${args.key} has ${length} element(s)` }] };
  }

  // Set Operations Handlers
  private async handleSAdd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.sAdd(args.key, args.members);
    return { content: [{ type: "text", text: `Added ${count} member(s) to set ${args.key}` }] };
  }

  private async handleSMembers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const members = await this.client!.sMembers(args.key);
    return { content: [{ type: "text", text: JSON.stringify(members, null, 2) }] };
  }

  private async handleSRem(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.sRem(args.key, args.members);
    return { content: [{ type: "text", text: `Removed ${count} member(s) from set ${args.key}` }] };
  }

  private async handleSIsMember(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const isMember = await this.client!.sIsMember(args.key, args.member);
    return { content: [{ type: "text", text: `${args.member} ${isMember ? 'is' : 'is not'} a member of ${args.key}` }] };
  }

  private async handleSCard(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.sCard(args.key);
    return { content: [{ type: "text", text: `Set ${args.key} has ${count} member(s)` }] };
  }

  // Sorted Set Operations Handlers
  private async handleZAdd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const members = args.members.map((m: any) => ({ score: m.score, value: m.value }));
    const count = await this.client!.zAdd(args.key, members);
    return { content: [{ type: "text", text: `Added ${count} member(s) to sorted set ${args.key}` }] };
  }

  private async handleZRange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const members = args.withScores
      ? await this.client!.zRangeWithScores(args.key, args.start, args.stop)
      : await this.client!.zRange(args.key, args.start, args.stop);
    return { content: [{ type: "text", text: JSON.stringify(members, null, 2) }] };
  }

  private async handleZRem(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.zRem(args.key, args.members);
    return { content: [{ type: "text", text: `Removed ${count} member(s) from sorted set ${args.key}` }] };
  }

  private async handleZScore(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const score = await this.client!.zScore(args.key, args.member);
    return { content: [{ type: "text", text: score !== null ? `Score: ${score}` : `Member ${args.member} not found in ${args.key}` }] };
  }

  private async handleZCard(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.zCard(args.key);
    return { content: [{ type: "text", text: `Sorted set ${args.key} has ${count} member(s)` }] };
  }

  private async handleZRank(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const rank = await this.client!.zRank(args.key, args.member);
    return { content: [{ type: "text", text: rank !== null ? `Rank: ${rank}` : `Member ${args.member} not found in ${args.key}` }] };
  }

  // Key Inspection Handlers
  private async handleType(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const type = await this.client!.type(args.key);
    return { content: [{ type: "text", text: `Type of ${args.key}: ${type}` }] };
  }

  private async handleRename(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.client!.rename(args.oldKey, args.newKey);
    return { content: [{ type: "text", text: `Renamed ${args.oldKey} to ${args.newKey}` }] };
  }

  private async handlePersist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.client!.persist(args.key);
    return { content: [{ type: "text", text: result ? `Removed expiration from ${args.key}` : `${args.key} does not have an expiration` }] };
  }

  // Stream Handlers
  private async handleXAdd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const id = await this.client!.xAdd(args.key, args.id, args.fields);
    return { content: [{ type: "text", text: `Added entry to stream ${args.key} with ID: ${id}` }] };
  }

  private async handleXRead(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.count) options.COUNT = args.count;
    if (args.block !== undefined) options.BLOCK = args.block;
    const result = await this.client!.xRead(args.streams, options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async handleXRange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.client!.xRange(args.key, args.start, args.end, args.count ? { COUNT: args.count } : undefined);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async handleXLen(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await this.client!.xLen(args.key);
    return { content: [{ type: "text", text: `Stream ${args.key} length: ${length}` }] };
  }

  // Geospatial Handlers
  private async handleGeoAdd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.geoAdd(args.key, args.members);
    return { content: [{ type: "text", text: `Added ${count} geospatial items to ${args.key}` }] };
  }

  private async handleGeoDist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const distance = await this.client!.geoDist(args.key, args.member1, args.member2, args.unit || 'm');
    return { content: [{ type: "text", text: `Distance: ${distance} ${args.unit || 'm'}` }] };
  }

  private async handleGeoRadius(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.client!.geoRadius(args.key, { longitude: args.longitude, latitude: args.latitude }, args.radius, args.unit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  // HyperLogLog Handlers
  private async handlePfAdd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.client!.pfAdd(args.key, args.elements);
    return { content: [{ type: "text", text: `PfAdd result: ${result}` }] };
  }

  private async handlePfCount(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.pfCount(args.keys);
    return { content: [{ type: "text", text: `Cardinality: ${count}` }] };
  }

  // Bitmap Handlers
  private async handleSetBit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const oldValue = await this.client!.setBit(args.key, args.offset, args.value);
    return { content: [{ type: "text", text: `Set bit at offset ${args.offset}, old value: ${oldValue}` }] };
  }

  private async handleGetBit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await this.client!.getBit(args.key, args.offset);
    return { content: [{ type: "text", text: `Bit value at offset ${args.offset}: ${value}` }] };
  }

  private async handleBitCount(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.bitCount(args.key, args.start, args.end);
    return { content: [{ type: "text", text: `Bit count: ${count}` }] };
  }

  // Advanced Sorted Set Handlers
  private async handleZRangeByScore(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.withscores) options.WITHSCORES = true;
    const result = await this.client!.zRangeByScore(args.key, args.min, args.max, options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async handleZIncrBy(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const newScore = await this.client!.zIncrBy(args.key, args.increment, args.member);
    return { content: [{ type: "text", text: `New score for ${args.member}: ${newScore}` }] };
  }

  private async handleZCount(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.zCount(args.key, args.min, args.max);
    return { content: [{ type: "text", text: `Count in range: ${count}` }] };
  }

  // Scan Handlers
  private async handleScan(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.match) options.MATCH = args.match;
    if (args.count) options.COUNT = args.count;
    const result = await this.client!.scan(parseInt(args.cursor), options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async handleHScan(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.match) options.MATCH = args.match;
    if (args.count) options.COUNT = args.count;
    const result = await this.client!.hScan(args.key, parseInt(args.cursor), options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async handleSScan(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.match) options.MATCH = args.match;
    if (args.count) options.COUNT = args.count;
    const result = await this.client!.sScan(args.key, parseInt(args.cursor), options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async handleZScan(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = {};
    if (args.match) options.MATCH = args.match;
    if (args.count) options.COUNT = args.count;
    const result = await this.client!.zScan(args.key, parseInt(args.cursor), options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  // String Range Handlers
  private async handleGetRange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const value = await this.client!.getRange(args.key, args.start, args.end);
    return { content: [{ type: "text", text: value }] };
  }

  private async handleSetRange(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await this.client!.setRange(args.key, args.offset, args.value);
    return { content: [{ type: "text", text: `String length after modification: ${length}` }] };
  }

  // Set Operation Handlers
  private async handleSInter(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.client!.sInter(args.keys);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async handleSUnion(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.client!.sUnion(args.keys);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async handleSDiff(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.client!.sDiff(args.keys);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  // Sorted Set Store Handlers
  private async handleZUnionStore(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = { KEYS: args.keys };
    if (args.weights) options.WEIGHTS = args.weights;
    const count = await this.client!.zUnionStore(args.destination, args.keys, options);
    return { content: [{ type: "text", text: `Stored ${count} members in ${args.destination}` }] };
  }

  private async handleZInterStore(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const options: any = { KEYS: args.keys };
    if (args.weights) options.WEIGHTS = args.weights;
    const count = await this.client!.zInterStore(args.destination, args.keys, options);
    return { content: [{ type: "text", text: `Stored ${count} members in ${args.destination}` }] };
  }

  // List Insert Handler
  private async handleLInsert(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const length = await this.client!.lInsert(args.key, args.position, args.pivot, args.element);
    return { content: [{ type: "text", text: `List length after insert: ${length}` }] };
  }

  // Pub/Sub Handlers
  private async handlePublish(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const count = await this.client!.publish(args.channel, args.message);
    return { content: [{ type: "text", text: `Published message to ${args.channel}, received by ${count} subscriber(s)` }] };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("@robinsonai/redis-mcp server running on stdio");
  }
}

const server = new RobinsonAIRedisMCP();
server.run().catch(console.error);
