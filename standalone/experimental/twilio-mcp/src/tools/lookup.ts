import { TwilioClient } from '../client.js';

export function createLookupTools(client: TwilioClient) {
  return {
    twilio_lookup_phone_number: {
      description: 'Look up phone number information (carrier, caller name, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          phone_number: { type: 'string', description: 'Phone number to look up (E.164 format)' },
          type: {
            type: 'array',
            items: { type: 'string', enum: ['carrier', 'caller-name', 'sms-pumping-risk', 'call-forwarding', 'live-activity', 'line-type-intelligence', 'sim-swap'] },
            description: 'Types of information to retrieve'
          },
          country_code: { type: 'string', description: 'ISO country code if not using E.164' },
          add_ons: { type: 'array', items: { type: 'string' }, description: 'Add-ons to execute' },
          add_ons_data: { type: 'object', description: 'Parameters for add-ons' }
        },
        required: ['phone_number']
      },
      handler: async (args: any) => {
        const { phone_number, type, ...otherParams } = args;
        const lookupParams: any = { ...otherParams };
        if (type) {
          lookupParams.type = type;
        }
        const phoneNumber = await client.getClient().lookups.v2
          .phoneNumbers(phone_number)
          .fetch(lookupParams);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(phoneNumber, null, 2)
          }]
        };
      }
    },

    twilio_lookup_phone_number_v1: {
      description: 'Look up phone number using Lookup API v1 (legacy)',
      inputSchema: {
        type: 'object',
        properties: {
          phone_number: { type: 'string', description: 'Phone number to look up' },
          country_code: { type: 'string', description: 'ISO country code' },
          type: { type: 'array', items: { type: 'string', enum: ['carrier', 'caller-name'] }, description: 'Types of information' },
          add_ons: { type: 'array', items: { type: 'string' }, description: 'Add-ons to execute' }
        },
        required: ['phone_number']
      },
      handler: async (args: any) => {
        const { phone_number, ...lookupParams } = args;
        const phoneNumber = await client.getClient().lookups.v1
          .phoneNumbers(phone_number)
          .fetch(lookupParams);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(phoneNumber, null, 2)
          }]
        };
      }
    }
  };
}

