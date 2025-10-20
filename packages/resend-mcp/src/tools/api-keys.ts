import { z } from 'zod';
import { ResendClient } from '../client.js';
import { CreateApiKeySchema } from '../types.js';

export function createApiKeyTools(client: ResendClient) {
  return {
    resend_create_api_key: {
      description: 'Create a new API key',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name for the API key' },
          permission: { 
            type: 'string', 
            enum: ['full_access', 'sending_access'],
            description: 'Permission level for the API key' 
          },
          domain_id: { type: 'string', description: 'Restrict API key to specific domain' }
        },
        required: ['name']
      },
      handler: async (args: any) => {
        const validated = CreateApiKeySchema.parse(args);
        const result = await client.createApiKey(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_list_api_keys: {
      description: 'List all API keys in your account',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const result = await client.listApiKeys();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_delete_api_key: {
      description: 'Delete an API key',
      inputSchema: {
        type: 'object',
        properties: {
          api_key_id: { type: 'string', description: 'API key ID to delete' }
        },
        required: ['api_key_id']
      },
      handler: async (args: any) => {
        const result = await client.deleteApiKey(args.api_key_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    }
  };
}

