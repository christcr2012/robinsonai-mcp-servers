import { CloudflareClient } from '../client.js';

export function createR2Tools(client: CloudflareClient) {
  return {
    cloudflare_list_r2_buckets: {
      description: 'List all R2 buckets',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          name_contains: { type: 'string', description: 'Filter by bucket name' },
          start_after: { type: 'string', description: 'Pagination cursor' },
          per_page: { type: 'number', description: 'Results per page' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const { account_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/accounts/${account_id}/r2/buckets?${queryString}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_r2_bucket: {
      description: 'Create an R2 bucket',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          name: { type: 'string', description: 'Bucket name' },
          location_hint: { type: 'string', description: 'Location hint (e.g., WNAM, ENAM, APAC, etc.)' }
        },
        required: ['account_id', 'name']
      },
      handler: async (args: any) => {
        const { account_id, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/r2/buckets`, 'POST', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_r2_bucket: {
      description: 'Get R2 bucket details',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          bucket_name: { type: 'string', description: 'Bucket name' }
        },
        required: ['account_id', 'bucket_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/r2/buckets/${args.bucket_name}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_r2_bucket: {
      description: 'Delete an R2 bucket',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          bucket_name: { type: 'string', description: 'Bucket name to delete' }
        },
        required: ['account_id', 'bucket_name']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/r2/buckets/${args.bucket_name}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_r2_bucket_usage: {
      description: 'Get R2 bucket usage metrics',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/r2/buckets/usage`, 'GET');
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

