/**
 * Cloudflare Tool Definitions Part 2
 * Zones (continued), Workers, KV, R2
 */

export const CLOUDFLARE_TOOLS_2 = [
  // ============================================================
  // ZONES (DNS & Domain Management) - 8 more tools
  // ============================================================
  {
    name: 'cloudflare_get_analytics',
    description: 'Get analytics data for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        since: { type: 'string', description: 'Start time (ISO 8601)' },
        until: { type: 'string', description: 'End time (ISO 8601)' },
        continuous: { type: 'boolean', description: 'Include continuous data' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_get_zone_plan',
    description: 'Get the plan for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_list_rate_limits',
    description: 'List rate limiting rules',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_create_rate_limit',
    description: 'Create a rate limiting rule',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        threshold: { type: 'number', description: 'Request threshold' },
        period: { type: 'number', description: 'Time period in seconds' },
        action: { type: 'object', description: 'Action to take' },
        match: { type: 'object', description: 'Match conditions' },
      },
      required: ['zoneId', 'threshold', 'period', 'action'],
    },
  },
  {
    name: 'cloudflare_delete_rate_limit',
    description: 'Delete a rate limiting rule',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        ruleId: { type: 'string', description: 'Rule ID' },
      },
      required: ['zoneId', 'ruleId'],
    },
  },
  {
    name: 'cloudflare_list_load_balancers',
    description: 'List load balancers for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_create_load_balancer',
    description: 'Create a load balancer',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        name: { type: 'string', description: 'Load balancer name' },
        defaultPools: { type: 'array', description: 'Default pool IDs' },
        fallbackPool: { type: 'string', description: 'Fallback pool ID' },
        ttl: { type: 'number', description: 'Time to live' },
      },
      required: ['zoneId', 'name', 'defaultPools'],
    },
  },
  {
    name: 'cloudflare_delete_load_balancer',
    description: 'Delete a load balancer',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        loadBalancerId: { type: 'string', description: 'Load balancer ID' },
      },
      required: ['zoneId', 'loadBalancerId'],
    },
  },

  // ============================================================
  // WORKERS (Serverless Functions) - 25 tools
  // ============================================================
  {
    name: 'cloudflare_list_workers',
    description: 'List all Workers scripts',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_get_worker',
    description: 'Get a Worker script',
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
    name: 'cloudflare_upload_worker',
    description: 'Upload or update a Worker script',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        scriptName: { type: 'string', description: 'Script name' },
        script: { type: 'string', description: 'Worker script content' },
        bindings: { type: 'array', description: 'Environment bindings (KV, R2, etc.)' },
      },
      required: ['accountId', 'scriptName', 'script'],
    },
  },
  {
    name: 'cloudflare_delete_worker',
    description: 'Delete a Worker script',
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
    name: 'cloudflare_list_worker_routes',
    description: 'List routes for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_create_worker_route',
    description: 'Create a Worker route',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        pattern: { type: 'string', description: 'URL pattern' },
        script: { type: 'string', description: 'Worker script name' },
      },
      required: ['zoneId', 'pattern'],
    },
  },
  {
    name: 'cloudflare_update_worker_route',
    description: 'Update a Worker route',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        routeId: { type: 'string', description: 'Route ID' },
        pattern: { type: 'string', description: 'URL pattern' },
        script: { type: 'string', description: 'Worker script name' },
      },
      required: ['zoneId', 'routeId'],
    },
  },
  {
    name: 'cloudflare_delete_worker_route',
    description: 'Delete a Worker route',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        routeId: { type: 'string', description: 'Route ID' },
      },
      required: ['zoneId', 'routeId'],
    },
  },
  {
    name: 'cloudflare_list_worker_cron_triggers',
    description: 'List cron triggers for a Worker',
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
    name: 'cloudflare_create_worker_cron_trigger',
    description: 'Create a cron trigger for a Worker',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        scriptName: { type: 'string', description: 'Script name' },
        cron: { type: 'string', description: 'Cron expression' },
      },
      required: ['accountId', 'scriptName', 'cron'],
    },
  },
  {
    name: 'cloudflare_delete_worker_cron_trigger',
    description: 'Delete a cron trigger',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        scriptName: { type: 'string', description: 'Script name' },
        triggerId: { type: 'string', description: 'Trigger ID' },
      },
      required: ['accountId', 'scriptName', 'triggerId'],
    },
  },
  {
    name: 'cloudflare_get_worker_settings',
    description: 'Get settings for a Worker',
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
    name: 'cloudflare_update_worker_settings',
    description: 'Update Worker settings',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        scriptName: { type: 'string', description: 'Script name' },
        logpush: { type: 'boolean', description: 'Enable logpush' },
        bindings: { type: 'array', description: 'Environment bindings' },
      },
      required: ['accountId', 'scriptName'],
    },
  },
  {
    name: 'cloudflare_list_worker_subdomain',
    description: 'Get Workers subdomain',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_create_worker_subdomain',
    description: 'Create Workers subdomain',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        subdomain: { type: 'string', description: 'Subdomain name' },
      },
      required: ['accountId', 'subdomain'],
    },
  },
  {
    name: 'cloudflare_get_worker_tail',
    description: 'Get real-time logs for a Worker',
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
    name: 'cloudflare_list_worker_secrets',
    description: 'List secrets for a Worker',
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
    name: 'cloudflare_create_worker_secret',
    description: 'Create a secret for a Worker',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        scriptName: { type: 'string', description: 'Script name' },
        name: { type: 'string', description: 'Secret name' },
        text: { type: 'string', description: 'Secret value' },
      },
      required: ['accountId', 'scriptName', 'name', 'text'],
    },
  },
  {
    name: 'cloudflare_delete_worker_secret',
    description: 'Delete a Worker secret',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        scriptName: { type: 'string', description: 'Script name' },
        secretName: { type: 'string', description: 'Secret name' },
      },
      required: ['accountId', 'scriptName', 'secretName'],
    },
  },
];

