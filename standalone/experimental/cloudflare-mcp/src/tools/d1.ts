import { CloudflareClient } from '../client.js';

export function createD1Tools(client: CloudflareClient) {
  return {
    cloudflare_list_d1_databases: {
      description: 'List all D1 databases',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          name: { type: 'string', description: 'Filter by database name' },
          page: { type: 'number', description: 'Page number' },
          per_page: { type: 'number', description: 'Results per page' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const { account_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/accounts/${account_id}/d1/database?${queryString}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_create_d1_database: {
      description: 'Create a D1 database',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          name: { type: 'string', description: 'Database name' },
          location: { type: 'string', description: 'Location hint (e.g., WNAM, ENAM, APAC)' }
        },
        required: ['account_id', 'name']
      },
      handler: async (args: any) => {
        const { account_id, ...body } = args;
        const response = await client.request(`/accounts/${account_id}/d1/database`, 'POST', body);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_get_d1_database: {
      description: 'Get D1 database details',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          database_id: { type: 'string', description: 'Database ID' }
        },
        required: ['account_id', 'database_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/d1/database/${args.database_id}`, 'GET');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_d1_database: {
      description: 'Delete a D1 database',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          database_id: { type: 'string', description: 'Database ID to delete' }
        },
        required: ['account_id', 'database_id']
      },
      handler: async (args: any) => {
        const response = await client.request(`/accounts/${args.account_id}/d1/database/${args.database_id}`, 'DELETE');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_query_d1_database: {
      description: 'Execute SQL query on D1 database',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          database_id: { type: 'string', description: 'Database ID' },
          sql: { type: 'string', description: 'SQL query to execute' },
          params: { type: 'array', description: 'Query parameters' }
        },
        required: ['account_id', 'database_id', 'sql']
      },
      handler: async (args: any) => {
        const { account_id, database_id, sql, params } = args;
        const response = await client.request(`/accounts/${account_id}/d1/database/${database_id}/query`, 'POST', { sql, params });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }]
        };
      }
    },

    cloudflare_export_d1_database: {
      description: 'Export D1 database',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          database_id: { type: 'string', description: 'Database ID' },
          output_format: { type: 'string', enum: ['polling', 'raw'], description: 'Export format' }
        },
        required: ['account_id', 'database_id']
      },
      handler: async (args: any) => {
        const { account_id, database_id, ...params } = args;
        const queryString = new URLSearchParams(params as any).toString();
        const response = await client.request(`/accounts/${account_id}/d1/database/${database_id}/export?${queryString}`, 'POST');
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

