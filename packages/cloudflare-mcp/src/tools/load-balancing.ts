import { CloudflareClient } from '../client.js';

export function createLoadBalancingTools(client: CloudflareClient) {
  return {
    cloudflare_list_load_balancers: {
      description: 'List all load balancers for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/zones/${args.zone_id}/load_balancers`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_load_balancer: {
      description: 'Create a load balancer',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          name: { type: 'string', description: 'Load balancer name (DNS name)' },
          default_pools: { type: 'array', items: { type: 'string' }, description: 'Default pool IDs' },
          fallback_pool: { type: 'string', description: 'Fallback pool ID' },
          description: { type: 'string', description: 'Description' },
          ttl: { type: 'number', description: 'TTL in seconds' },
          steering_policy: { type: 'string', enum: ['off', 'geo', 'random', 'dynamic_latency', 'proximity', 'least_outstanding_requests', 'least_connections'], description: 'Steering policy' },
          proxied: { type: 'boolean', description: 'Proxy through Cloudflare' },
          enabled: { type: 'boolean', description: 'Enable load balancer' },
          session_affinity: { type: 'string', enum: ['none', 'cookie', 'ip_cookie'], description: 'Session affinity' },
          session_affinity_ttl: { type: 'number', description: 'Session affinity TTL' },
          session_affinity_attributes: { type: 'object', description: 'Session affinity attributes' }
        },
        required: ['zone_id', 'name', 'default_pools', 'fallback_pool']
      },
      handler: async (args: any) => {
        const { zone_id, ...body } = args;
        const response = await client.request(`/zones/${zone_id}/load_balancers`, 'POST', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_load_balancer: {
      description: 'Get load balancer details',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          load_balancer_id: { type: 'string', description: 'Load balancer ID' }
        },
        required: ['zone_id', 'load_balancer_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/zones/${args.zone_id}/load_balancers/${args.load_balancer_id}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_update_load_balancer: {
      description: 'Update a load balancer',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          load_balancer_id: { type: 'string', description: 'Load balancer ID' },
          name: { type: 'string', description: 'Load balancer name' },
          default_pools: { type: 'array', items: { type: 'string' }, description: 'Default pool IDs' },
          fallback_pool: { type: 'string', description: 'Fallback pool ID' },
          enabled: { type: 'boolean', description: 'Enable load balancer' },
          steering_policy: { type: 'string', description: 'Steering policy' }
        },
        required: ['zone_id', 'load_balancer_id']
      },
      handler: async (args: any) => {
        const { zone_id, load_balancer_id, ...body } = args;
        const response = await client.request(`/zones/${zone_id}/load_balancers/${load_balancer_id}`, 'PUT', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_load_balancer: {
      description: 'Delete a load balancer',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          load_balancer_id: { type: 'string', description: 'Load balancer ID to delete' }
        },
        required: ['zone_id', 'load_balancer_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/zones/${args.zone_id}/load_balancers/${args.load_balancer_id}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_list_load_balancer_pools: {
      description: 'List all load balancer pools',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/load_balancers/pools`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_load_balancer_pool: {
      description: 'Create a load balancer pool',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          name: { type: 'string', description: 'Pool name' },
          origins: { type: 'array', description: 'Array of origin servers' },
          description: { type: 'string', description: 'Description' },
          enabled: { type: 'boolean', description: 'Enable pool' },
          minimum_origins: { type: 'number', description: 'Minimum healthy origins' },
          monitor: { type: 'string', description: 'Monitor ID' },
          notification_email: { type: 'string', description: 'Notification email' },
          notification_filter: { type: 'object', description: 'Notification filter' }
        },
        required: ['account_id', 'name', 'origins']
      },
      handler: async (args: any) => {
        const { account_id, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/load_balancers/pools`, 'POST', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_load_balancer_pool: {
      description: 'Get load balancer pool details',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          pool_id: { type: 'string', description: 'Pool ID' }
        },
        required: ['account_id', 'pool_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/load_balancers/pools/${args.pool_id}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_update_load_balancer_pool: {
      description: 'Update a load balancer pool',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          pool_id: { type: 'string', description: 'Pool ID' },
          name: { type: 'string', description: 'Pool name' },
          origins: { type: 'array', description: 'Array of origin servers' },
          enabled: { type: 'boolean', description: 'Enable pool' }
        },
        required: ['account_id', 'pool_id']
      },
      handler: async (args: any) => {
        const { account_id, pool_id, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/load_balancers/pools/${pool_id}`, 'PUT', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_load_balancer_pool: {
      description: 'Delete a load balancer pool',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          pool_id: { type: 'string', description: 'Pool ID to delete' }
        },
        required: ['account_id', 'pool_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/load_balancers/pools/${args.pool_id}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_list_load_balancer_monitors: {
      description: 'List all load balancer monitors',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/load_balancers/monitors`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_load_balancer_monitor: {
      description: 'Create a load balancer monitor',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          type: { type: 'string', enum: ['http', 'https', 'tcp', 'udp_icmp', 'icmp_ping', 'smtp'], description: 'Monitor type' },
          description: { type: 'string', description: 'Description' },
          method: { type: 'string', description: 'HTTP method (for HTTP/HTTPS)' },
          path: { type: 'string', description: 'Path to monitor (for HTTP/HTTPS)' },
          header: { type: 'object', description: 'HTTP headers' },
          port: { type: 'number', description: 'Port number' },
          timeout: { type: 'number', description: 'Timeout in seconds' },
          retries: { type: 'number', description: 'Number of retries' },
          interval: { type: 'number', description: 'Interval in seconds' },
          expected_codes: { type: 'string', description: 'Expected HTTP codes (e.g., "200,201")' },
          expected_body: { type: 'string', description: 'Expected response body' },
          follow_redirects: { type: 'boolean', description: 'Follow redirects' },
          allow_insecure: { type: 'boolean', description: 'Allow insecure certificates' },
          probe_zone: { type: 'string', description: 'Probe zone' }
        },
        required: ['account_id', 'type']
      },
      handler: async (args: any) => {
        const { account_id, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/load_balancers/monitors`, 'POST', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_load_balancer_monitor: {
      description: 'Get load balancer monitor details',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          monitor_id: { type: 'string', description: 'Monitor ID' }
        },
        required: ['account_id', 'monitor_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/load_balancers/monitors/${args.monitor_id}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_update_load_balancer_monitor: {
      description: 'Update a load balancer monitor',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          monitor_id: { type: 'string', description: 'Monitor ID' },
          type: { type: 'string', description: 'Monitor type' },
          description: { type: 'string', description: 'Description' },
          interval: { type: 'number', description: 'Interval in seconds' }
        },
        required: ['account_id', 'monitor_id']
      },
      handler: async (args: any) => {
        const { account_id, monitor_id, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/load_balancers/monitors/${monitor_id}`, 'PUT', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_load_balancer_monitor: {
      description: 'Delete a load balancer monitor',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          monitor_id: { type: 'string', description: 'Monitor ID to delete' }
        },
        required: ['account_id', 'monitor_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/load_balancers/monitors/${args.monitor_id}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    }
  };
}

