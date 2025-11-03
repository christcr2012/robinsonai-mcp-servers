import { z } from 'zod';
import { TwilioClient } from '../client.js';

export function createMessagingServiceNumberTools(client: TwilioClient) {
  return {
    twilio_list_messaging_service_numbers: {
      description: 'List phone numbers in a messaging service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Messaging Service SID' },
          limit: { type: 'number', description: 'Maximum results' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        const result = await client.listMessagingServiceNumbers(args.service_sid, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_add_number_to_messaging_service: {
      description: 'Add phone number to messaging service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Messaging Service SID' },
          phone_number_sid: { type: 'string', description: 'Phone number SID to add' }
        },
        required: ['service_sid', 'phone_number_sid']
      },
      handler: async (args: any) => {
        const result = await client.addNumberToMessagingService(args.service_sid, args.phone_number_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_remove_number_from_messaging_service: {
      description: 'Remove phone number from messaging service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Messaging Service SID' },
          phone_number_sid: { type: 'string', description: 'Phone number SID to remove' }
        },
        required: ['service_sid', 'phone_number_sid']
      },
      handler: async (args: any) => {
        await client.removeNumberFromMessagingService(args.service_sid, args.phone_number_sid);
        return {
          content: [{
            type: 'text',
            text: 'Phone number removed from messaging service'
          }]
        };
      }
    }
  };
}

