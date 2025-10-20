import { CloudflareClient } from '../client.js';

export function createPagesTools(client: CloudflareClient) {
  return {
    cloudflare_list_pages_projects: {
      description: 'List all Pages projects',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_pages_project: {
      description: 'Create a Pages project',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          name: { type: 'string', description: 'Project name' },
          production_branch: { type: 'string', description: 'Production branch name' },
          build_config: { type: 'object', description: 'Build configuration' }
        },
        required: ['account_id', 'name']
      },
      handler: async (args: any) => {
        const { account_id, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/pages/projects`, 'POST', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_pages_project: {
      description: 'Get a Pages project',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' }
        },
        required: ['account_id', 'project_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_update_pages_project: {
      description: 'Update a Pages project',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          production_branch: { type: 'string', description: 'Production branch' },
          build_config: { type: 'object', description: 'Build configuration' }
        },
        required: ['account_id', 'project_name']
      },
      handler: async (args: any) => {
        const { account_id, project_name, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/pages/projects/${project_name}`, 'PATCH', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_pages_project: {
      description: 'Delete a Pages project',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name to delete' }
        },
        required: ['account_id', 'project_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_list_pages_deployments: {
      description: 'List deployments for a Pages project',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' }
        },
        required: ['account_id', 'project_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}/deployments`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_pages_deployment: {
      description: 'Create a Pages deployment',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          branch: { type: 'string', description: 'Branch name' }
        },
        required: ['account_id', 'project_name']
      },
      handler: async (args: any) => {
        const { account_id, project_name, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/pages/projects/${project_name}/deployments`, 'POST', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_pages_deployment: {
      description: 'Get a Pages deployment',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          deployment_id: { type: 'string', description: 'Deployment ID' }
        },
        required: ['account_id', 'project_name', 'deployment_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}/deployments/${args.deployment_id}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_pages_deployment: {
      description: 'Delete a Pages deployment',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          deployment_id: { type: 'string', description: 'Deployment ID to delete' }
        },
        required: ['account_id', 'project_name', 'deployment_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}/deployments/${args.deployment_id}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_retry_pages_deployment: {
      description: 'Retry a Pages deployment',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          deployment_id: { type: 'string', description: 'Deployment ID' }
        },
        required: ['account_id', 'project_name', 'deployment_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}/deployments/${args.deployment_id}/retry`, 'POST');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_rollback_pages_deployment: {
      description: 'Rollback to a previous Pages deployment',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          deployment_id: { type: 'string', description: 'Deployment ID to rollback to' }
        },
        required: ['account_id', 'project_name', 'deployment_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}/deployments/${args.deployment_id}/rollback`, 'POST');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_pages_deployment_logs: {
      description: 'Get deployment logs',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          deployment_id: { type: 'string', description: 'Deployment ID' }
        },
        required: ['account_id', 'project_name', 'deployment_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}/deployments/${args.deployment_id}/history/logs`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_list_pages_domains: {
      description: 'List custom domains for a Pages project',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' }
        },
        required: ['account_id', 'project_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}/domains`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_add_pages_domain: {
      description: 'Add a custom domain to a Pages project',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          name: { type: 'string', description: 'Domain name' }
        },
        required: ['account_id', 'project_name', 'name']
      },
      handler: async (args: any) => {
        const { account_id, project_name, name } = args;
        const response = await client.request(`/accounts/${account_id}/pages/projects/${project_name}/domains`, 'POST', { name });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_pages_domain: {
      description: 'Get a custom domain for a Pages project',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          domain_name: { type: 'string', description: 'Domain name' }
        },
        required: ['account_id', 'project_name', 'domain_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}/domains/${args.domain_name}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_pages_domain: {
      description: 'Delete a custom domain from a Pages project',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          project_name: { type: 'string', description: 'Project name' },
          domain_name: { type: 'string', description: 'Domain name to delete' }
        },
        required: ['account_id', 'project_name', 'domain_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/pages/projects/${args.project_name}/domains/${args.domain_name}`, 'DELETE');
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

