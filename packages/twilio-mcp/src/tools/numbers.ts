import { z } from 'zod';
import { TwilioClient } from '../client.js';
import { BuyPhoneNumberSchema, UpdatePhoneNumberSchema } from '../types.js';

export function createPhoneNumberTools(client: TwilioClient) {
  return {
    twilio_search_available_numbers: {
      description: 'Search for available phone numbers to purchase',
      inputSchema: {
        type: 'object',
        properties: {
          country_code: { type: 'string', description: 'Country code (e.g., US, GB, CA)', default: 'US' },
          area_code: { type: 'string', description: 'Area code to search in' },
          contains: { type: 'string', description: 'Digits the number must contain' },
          sms_enabled: { type: 'boolean', description: 'Filter for SMS-capable numbers' },
          mms_enabled: { type: 'boolean', description: 'Filter for MMS-capable numbers' },
          voice_enabled: { type: 'boolean', description: 'Filter for voice-capable numbers' },
          limit: { type: 'number', description: 'Maximum results to return' }
        },
        required: ['country_code']
      },
      handler: async (args: any) => {
        const { country_code, ...params } = args;
        const result = await client.searchAvailablePhoneNumbers(country_code, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_buy_phone_number: {
      description: 'Purchase a phone number',
      inputSchema: {
        type: 'object',
        properties: {
          phone_number: { type: 'string', description: 'Specific phone number to purchase (E.164 format)' },
          area_code: { type: 'string', description: 'Area code (if not specifying exact number)' },
          friendly_name: { type: 'string', description: 'Friendly name for the number' },
          sms_url: { type: 'string', description: 'Webhook URL for incoming SMS' },
          voice_url: { type: 'string', description: 'Webhook URL for incoming calls' },
          status_callback: { type: 'string', description: 'Status callback URL' }
        }
      },
      handler: async (args: any) => {
        const validated = BuyPhoneNumberSchema.parse(args);
        const result = await client.buyPhoneNumber(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_phone_number: {
      description: 'Get details of a phone number',
      inputSchema: {
        type: 'object',
        properties: {
          phone_number_sid: { type: 'string', description: 'Phone number SID' }
        },
        required: ['phone_number_sid']
      },
      handler: async (args: any) => {
        const result = await client.getPhoneNumber(args.phone_number_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_list_phone_numbers: {
      description: 'List all phone numbers in your account',
      inputSchema: {
        type: 'object',
        properties: {
          phone_number: { type: 'string', description: 'Filter by phone number' },
          friendly_name: { type: 'string', description: 'Filter by friendly name' },
          limit: { type: 'number', description: 'Maximum results to return' }
        }
      },
      handler: async (args: any) => {
        const result = await client.listPhoneNumbers(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_update_phone_number: {
      description: 'Update phone number configuration',
      inputSchema: {
        type: 'object',
        properties: {
          phone_number_sid: { type: 'string', description: 'Phone number SID' },
          friendly_name: { type: 'string', description: 'New friendly name' },
          sms_url: { type: 'string', description: 'Webhook URL for incoming SMS' },
          voice_url: { type: 'string', description: 'Webhook URL for incoming calls' },
          status_callback: { type: 'string', description: 'Status callback URL' },
          voice_method: { type: 'string', enum: ['GET', 'POST'], description: 'HTTP method for voice URL' },
          sms_method: { type: 'string', enum: ['GET', 'POST'], description: 'HTTP method for SMS URL' }
        },
        required: ['phone_number_sid']
      },
      handler: async (args: any) => {
        const validated = UpdatePhoneNumberSchema.parse(args);
        const { phone_number_sid, ...params } = validated;
        const result = await client.updatePhoneNumber(phone_number_sid, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_release_phone_number: {
      description: 'Release (delete) a phone number',
      inputSchema: {
        type: 'object',
        properties: {
          phone_number_sid: { type: 'string', description: 'Phone number SID to release' }
        },
        required: ['phone_number_sid']
      },
      handler: async (args: any) => {
        await client.releasePhoneNumber(args.phone_number_sid);
        return {
          content: [{
            type: 'text',
            text: 'Phone number released successfully'
          }]
        };
      }
    }
  };
}

