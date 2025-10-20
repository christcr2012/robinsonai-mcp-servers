import { CloudflareClient } from '../client.js';

export function createWorkersTools(client: CloudflareClient) {
  return {
    cloudflare_list_workers: {
      description: 'List all Workers scripts in an account',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/workers/scripts`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_worker: {
      description: 'Get a Worker script',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          script_name: { type: 'string', description: 'Script name' }
        },
        required: ['account_id', 'script_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/workers/scripts/${args.script_name}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_upload_worker: {
      description: 'Upload or update a Worker script',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          script_name: { type: 'string', description: 'Script name' },
          script: { type: 'string', description: 'Worker script content' },
          bindings: { type: 'array', description: 'Environment bindings (KV, Durable Objects, etc.)' },
          compatibility_date: { type: 'string', description: 'Compatibility date (YYYY-MM-DD)' },
          compatibility_flags: { type: 'array', items: { type: 'string' }, description: 'Compatibility flags' }
        },
        required: ['account_id', 'script_name', 'script']
      },
      handler: async (args: any) => {
        const { account_id, script_name, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/workers/scripts/${script_name}`, 'PUT', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_worker: {
      description: 'Delete a Worker script',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          script_name: { type: 'string', description: 'Script name to delete' }
        },
        required: ['account_id', 'script_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/workers/scripts/${args.script_name}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_list_worker_routes: {
      description: 'List Worker routes for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/zones/${args.zone_id}/workers/routes`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_worker_route: {
      description: 'Create a Worker route',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          pattern: { type: 'string', description: 'Route pattern (e.g., example.com/*)' },
          script: { type: 'string', description: 'Worker script name' }
        },
        required: ['zone_id', 'pattern']
      },
      handler: async (args: any) => {
        const { zone_id, ...body } = args;
        const response = await client.request(`/zones/${zone_id}/workers/routes`, 'POST', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_worker_route: {
      description: 'Get a Worker route',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          route_id: { type: 'string', description: 'Route ID' }
        },
        required: ['zone_id', 'route_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/zones/${args.zone_id}/workers/routes/${args.route_id}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_update_worker_route: {
      description: 'Update a Worker route',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          route_id: { type: 'string', description: 'Route ID' },
          pattern: { type: 'string', description: 'New route pattern' },
          script: { type: 'string', description: 'Worker script name' }
        },
        required: ['zone_id', 'route_id']
      },
      handler: async (args: any) => {
        const { zone_id, route_id, ...body } = args;
        const response = await client.request(`/zones/${zone_id}/workers/routes/${route_id}`, 'PUT', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_worker_route: {
      description: 'Delete a Worker route',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          route_id: { type: 'string', description: 'Route ID to delete' }
        },
        required: ['zone_id', 'route_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/zones/${args.zone_id}/workers/routes/${args.route_id}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_list_worker_cron_triggers: {
      description: 'List cron triggers for a Worker',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          script_name: { type: 'string', description: 'Script name' }
        },
        required: ['account_id', 'script_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/workers/scripts/${args.script_name}/schedules`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_update_worker_cron_triggers: {
      description: 'Update cron triggers for a Worker',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          script_name: { type: 'string', description: 'Script name' },
          crons: { type: 'array', items: { type: 'string' }, description: 'Cron expressions (e.g., ["0 0 * * *"])' }
        },
        required: ['account_id', 'script_name', 'crons']
      },
      handler: async (args: any) => {
        const { account_id, script_name, crons } = args;
        const response = await client.request(`/accounts/${account_id}/workers/scripts/${script_name}/schedules`, 'PUT', { crons });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_worker_subdomain: {
      description: 'Get Workers subdomain (workers.dev)',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/workers/subdomain`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_worker_subdomain: {
      description: 'Create Workers subdomain (workers.dev)',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          subdomain: { type: 'string', description: 'Subdomain name (e.g., "mycompany" for mycompany.workers.dev)' }
        },
        required: ['account_id', 'subdomain']
      },
      handler: async (args: any) => {
        const { account_id, subdomain } = args;
        const response = await client.request(`/accounts/${account_id}/workers/subdomain`, 'PUT', { subdomain });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_list_worker_namespaces: {
      description: 'List KV namespaces',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          page: { type: 'number', description: 'Page number' },
          per_page: { type: 'number', description: 'Results per page' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const { account_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/accounts/${account_id}/storage/kv/namespaces?${queryString}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_worker_namespace: {
      description: 'Create a KV namespace',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          title: { type: 'string', description: 'Namespace title' }
        },
        required: ['account_id', 'title']
      },
      handler: async (args: any) => {
        const { account_id, title } = args;
        const response = await client.request(`/accounts/${account_id}/storage/kv/namespaces`, 'POST', { title });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_worker_namespace: {
      description: 'Delete a KV namespace',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          namespace_id: { type: 'string', description: 'Namespace ID to delete' }
        },
        required: ['account_id', 'namespace_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/storage/kv/namespaces/${args.namespace_id}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_rename_worker_namespace: {
      description: 'Rename a KV namespace',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          namespace_id: { type: 'string', description: 'Namespace ID' },
          title: { type: 'string', description: 'New title' }
        },
        required: ['account_id', 'namespace_id', 'title']
      },
      handler: async (args: any) => {
        const { account_id, namespace_id, title } = args;
        const response = await client.request(`/accounts/${account_id}/storage/kv/namespaces/${namespace_id}`, 'PUT', { title });
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

