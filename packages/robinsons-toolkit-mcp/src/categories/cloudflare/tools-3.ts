/**
 * Cloudflare Tool Definitions Part 3
 * Workers (continued), KV, R2, Pages, D1, Queues, Durable Objects, Stream
 */

export const CLOUDFLARE_TOOLS_3 = [
  // ============================================================
  // WORKERS (Serverless Functions) - 7 more tools
  // ============================================================
  {
    name: 'cloudflare_list_worker_deployments',
    description: 'List deployments for a Worker',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        scriptName: { type: 'string', description: 'Script name' },
      },
      required: ['accountId', 'scriptName'],
    },
  },
  {
    name: 'cloudflare_get_worker_usage',
    description: 'Get usage metrics for Workers',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_list_worker_namespaces',
    description: 'List Worker namespaces',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_create_worker_namespace',
    description: 'Create a Worker namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        title: { type: 'string', description: 'Namespace title' },
      },
      required: ['accountId', 'title'],
    },
  },
  {
    name: 'cloudflare_delete_worker_namespace',
    description: 'Delete a Worker namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },
  {
    name: 'cloudflare_rename_worker_namespace',
    description: 'Rename a Worker namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        title: { type: 'string', description: 'New title' },
      },
      required: ['accountId', 'namespaceId', 'title'],
    },
  },
  {
    name: 'cloudflare_get_worker_analytics',
    description: 'Get analytics for a Worker',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        scriptName: { type: 'string', description: 'Script name' },
      },
      required: ['accountId', 'scriptName'],
    },
  },

  // ============================================================
  // KV (Key-Value Storage) - 15 tools
  // ============================================================
  {
    name: 'cloudflare_list_kv_namespaces',
    description: 'List KV namespaces',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_create_kv_namespace',
    description: 'Create a KV namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        title: { type: 'string', description: 'Namespace title' },
      },
      required: ['accountId', 'title'],
    },
  },
  {
    name: 'cloudflare_delete_kv_namespace',
    description: 'Delete a KV namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },
  {
    name: 'cloudflare_rename_kv_namespace',
    description: 'Rename a KV namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        title: { type: 'string', description: 'New title' },
      },
      required: ['accountId', 'namespaceId', 'title'],
    },
  },
  {
    name: 'cloudflare_list_kv_keys',
    description: 'List keys in a KV namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        prefix: { type: 'string', description: 'Key prefix filter' },
        limit: { type: 'number', description: 'Max keys to return' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },
  {
    name: 'cloudflare_read_kv_value',
    description: 'Read a value from KV',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        key: { type: 'string', description: 'Key name' },
      },
      required: ['accountId', 'namespaceId', 'key'],
    },
  },
  {
    name: 'cloudflare_write_kv_value',
    description: 'Write a value to KV',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        key: { type: 'string', description: 'Key name' },
        value: { type: 'string', description: 'Value to store' },
        expirationTtl: { type: 'number', description: 'TTL in seconds' },
        metadata: { type: 'object', description: 'Metadata object' },
      },
      required: ['accountId', 'namespaceId', 'key', 'value'],
    },
  },
  {
    name: 'cloudflare_delete_kv_value',
    description: 'Delete a value from KV',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        key: { type: 'string', description: 'Key name' },
      },
      required: ['accountId', 'namespaceId', 'key'],
    },
  },
  {
    name: 'cloudflare_write_kv_bulk',
    description: 'Write multiple key-value pairs',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        pairs: { type: 'array', description: 'Array of key-value pairs' },
      },
      required: ['accountId', 'namespaceId', 'pairs'],
    },
  },
  {
    name: 'cloudflare_delete_kv_bulk',
    description: 'Delete multiple keys',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        keys: { type: 'array', items: { type: 'string' }, description: 'Keys to delete' },
      },
      required: ['accountId', 'namespaceId', 'keys'],
    },
  },
  {
    name: 'cloudflare_get_kv_metadata',
    description: 'Get metadata for a KV key',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        key: { type: 'string', description: 'Key name' },
      },
      required: ['accountId', 'namespaceId', 'key'],
    },
  },
  {
    name: 'cloudflare_list_kv_values',
    description: 'List all values in a KV namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
        cursor: { type: 'string', description: 'Pagination cursor' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },
  {
    name: 'cloudflare_get_kv_usage',
    description: 'Get usage statistics for KV',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },
  {
    name: 'cloudflare_export_kv_namespace',
    description: 'Export all data from a KV namespace',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        namespaceId: { type: 'string', description: 'Namespace ID' },
      },
      required: ['accountId', 'namespaceId'],
    },
  },

  // ============================================================
  // R2 (Object Storage) - 20 tools
  // ============================================================
  {
    name: 'cloudflare_list_r2_buckets',
    description: 'List R2 buckets',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_create_r2_bucket',
    description: 'Create an R2 bucket',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        name: { type: 'string', description: 'Bucket name' },
        locationHint: { type: 'string', description: 'Location hint (e.g., WNAM, ENAM)' },
      },
      required: ['accountId', 'name'],
    },
  },
  {
    name: 'cloudflare_delete_r2_bucket',
    description: 'Delete an R2 bucket',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
      },
      required: ['accountId', 'bucketName'],
    },
  },
  {
    name: 'cloudflare_list_r2_objects',
    description: 'List objects in an R2 bucket',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        prefix: { type: 'string', description: 'Object key prefix' },
        delimiter: { type: 'string', description: 'Delimiter for grouping' },
        maxKeys: { type: 'number', description: 'Max objects to return' },
      },
      required: ['accountId', 'bucketName'],
    },
  },
  {
    name: 'cloudflare_get_r2_object',
    description: 'Get an object from R2',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
      },
      required: ['accountId', 'bucketName', 'key'],
    },
  },
  {
    name: 'cloudflare_put_r2_object',
    description: 'Upload an object to R2',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
        body: { type: 'string', description: 'Object content' },
        contentType: { type: 'string', description: 'Content type' },
        metadata: { type: 'object', description: 'Custom metadata' },
      },
      required: ['accountId', 'bucketName', 'key', 'body'],
    },
  },
  {
    name: 'cloudflare_delete_r2_object',
    description: 'Delete an object from R2',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
      },
      required: ['accountId', 'bucketName', 'key'],
    },
  },
];

