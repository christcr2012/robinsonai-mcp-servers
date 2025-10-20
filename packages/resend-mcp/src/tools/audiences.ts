import { z } from 'zod';
import { ResendClient } from '../client.js';
import { CreateAudienceSchema } from '../types.js';

export function createAudienceTools(client: ResendClient) {
  return {
    resend_create_audience: {
      description: 'Create a new audience (mailing list)',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the audience' }
        },
        required: ['name']
      },
      handler: async (args: any) => {
        const validated = CreateAudienceSchema.parse(args);
        const result = await client.createAudience(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_get_audience: {
      description: 'Get details of a specific audience',
      inputSchema: {
        type: 'object',
        properties: {
          audience_id: { type: 'string', description: 'Audience ID to retrieve' }
        },
        required: ['audience_id']
      },
      handler: async (args: any) => {
        const result = await client.getAudience(args.audience_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_list_audiences: {
      description: 'List all audiences in your account',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const result = await client.listAudiences();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_delete_audience: {
      description: 'Delete an audience',
      inputSchema: {
        type: 'object',
        properties: {
          audience_id: { type: 'string', description: 'Audience ID to delete' }
        },
        required: ['audience_id']
      },
      handler: async (args: any) => {
        const result = await client.deleteAudience(args.audience_id);
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

