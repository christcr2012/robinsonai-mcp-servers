import { CloudflareClient } from '../client.js';

export function createAnalyticsTools(client: CloudflareClient) {
  return {
    cloudflare_get_zone_analytics_dashboard: {
      description: 'Get analytics dashboard data for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          since: { type: 'string', description: 'Start time (ISO 8601 or relative like -1440 for 24h ago)' },
          until: { type: 'string', description: 'End time (ISO 8601 or relative)' },
          continuous: { type: 'boolean', description: 'Include continuous data' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/zones/${zone_id}/analytics/dashboard?${queryString}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_zone_analytics_colos: {
      description: 'Get analytics by Cloudflare data center',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          since: { type: 'string', description: 'Start time' },
          until: { type: 'string', description: 'End time' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/zones/${zone_id}/analytics/colos?${queryString}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_dns_analytics: {
      description: 'Get DNS analytics for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          since: { type: 'string', description: 'Start time' },
          until: { type: 'string', description: 'End time' },
          dimensions: { type: 'string', description: 'Dimensions to group by' },
          metrics: { type: 'string', description: 'Metrics to retrieve' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/zones/${zone_id}/dns_analytics/report?${queryString}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_dns_analytics_by_time: {
      description: 'Get DNS analytics by time series',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          since: { type: 'string', description: 'Start time' },
          until: { type: 'string', description: 'End time' },
          time_delta: { type: 'string', description: 'Time delta (e.g., hour, day)' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/zones/${zone_id}/dns_analytics/report/bytime?${queryString}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_http_requests_analytics: {
      description: 'Get HTTP requests analytics using GraphQL',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          query: { type: 'string', description: 'GraphQL query' },
          variables: { type: 'object', description: 'GraphQL variables' }
        },
        required: ['zone_id', 'query']
      },
      handler: async (args: any) => {
        const { zone_id, query, variables } = args;
        const response = await client.request(`/graphql`, 'POST', { query, variables: { ...variables, zoneTag: zone_id } });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_firewall_events: {
      description: 'Get firewall events analytics',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          since: { type: 'string', description: 'Start time' },
          until: { type: 'string', description: 'End time' },
          action: { type: 'string', description: 'Filter by action (block, challenge, etc.)' },
          source: { type: 'string', description: 'Filter by source' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/zones/${zone_id}/firewall/events?${queryString}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_workers_analytics: {
      description: 'Get Workers analytics',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          script_name: { type: 'string', description: 'Script name (optional)' },
          since: { type: 'string', description: 'Start time' },
          until: { type: 'string', description: 'End time' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const { account_id, script_name, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const endpoint = script_name 
          ? `/accounts/${account_id}/workers/scripts/${script_name}/analytics?${queryString}`
          : `/accounts/${account_id}/workers/analytics?${queryString}`;
        const response = await client.request(endpoint, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_load_balancing_analytics: {
      description: 'Get load balancing analytics',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          since: { type: 'string', description: 'Start time' },
          until: { type: 'string', description: 'End time' },
          pool_id: { type: 'string', description: 'Filter by pool ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/zones/${zone_id}/load_balancers/analytics?${queryString}`, 'GET');
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

