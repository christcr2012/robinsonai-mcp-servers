import { z } from 'zod';
import { TwilioClient } from '../client.js';
import { CreateSubaccountSchema } from '../types.js';

export function createSubaccountTools(client: TwilioClient) {
  return {
    twilio_create_subaccount: {
      description: 'Create a new subaccount',
      inputSchema: {
        type: 'object',
        properties: {
          friendly_name: { type: 'string', description: 'Friendly name for the subaccount' }
        },
        required: ['friendly_name']
      },
      handler: async (args: any) => {
        const validated = CreateSubaccountSchema.parse(args);
        const result = await client.createSubaccount(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_subaccount: {
      description: 'Get details of a subaccount',
      inputSchema: {
        type: 'object',
        properties: {
          subaccount_sid: { type: 'string', description: 'Subaccount SID' }
        },
        required: ['subaccount_sid']
      },
      handler: async (args: any) => {
        const result = await client.getSubaccount(args.subaccount_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_list_subaccounts: {
      description: 'List all subaccounts',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const result = await client.listSubaccounts();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_update_subaccount: {
      description: 'Update subaccount settings',
      inputSchema: {
        type: 'object',
        properties: {
          subaccount_sid: { type: 'string', description: 'Subaccount SID' },
          friendly_name: { type: 'string', description: 'New friendly name' },
          status: {
            type: 'string',
            enum: ['active', 'suspended', 'closed'],
            description: 'Account status'
          }
        },
        required: ['subaccount_sid']
      },
      handler: async (args: any) => {
        const { subaccount_sid, ...params } = args;
        const result = await client.updateSubaccount(subaccount_sid, params);
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

