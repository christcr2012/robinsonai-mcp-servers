import { z } from 'zod';
import { TwilioClient } from '../client.js';

export function createUsageTools(client: TwilioClient) {
  return {
    twilio_get_usage: {
      description: 'Get usage records for your account',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Usage category (sms, sms-inbound, sms-outbound, calls, calls-inbound, calls-outbound, recordings, etc.)'
          },
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          limit: { type: 'number', description: 'Maximum results to return' }
        }
      },
      handler: async (args: any) => {
        const result = await client.getUsage(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_balance: {
      description: 'Get current account balance',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const result = await client.getBalance();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_list_usage_triggers: {
      description: 'List usage triggers (alerts for spending thresholds)',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const result = await client.getUsageTriggers();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_create_usage_trigger: {
      description: 'Create a usage trigger to alert when spending reaches a threshold',
      inputSchema: {
        type: 'object',
        properties: {
          callback_url: { type: 'string', description: 'Webhook URL to call when triggered' },
          trigger_value: { type: 'string', description: 'Threshold value (e.g., "100" for $100)' },
          usage_category: {
            type: 'string',
            description: 'Usage category to monitor (sms, calls, etc.)'
          },
          callback_method: { type: 'string', enum: ['GET', 'POST'], description: 'HTTP method' },
          friendly_name: { type: 'string', description: 'Friendly name for the trigger' }
        },
        required: ['callback_url', 'trigger_value', 'usage_category']
      },
      handler: async (args: any) => {
        const result = await client.createUsageTrigger(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_delete_usage_trigger: {
      description: 'Delete a usage trigger',
      inputSchema: {
        type: 'object',
        properties: {
          trigger_sid: { type: 'string', description: 'Usage trigger SID to delete' }
        },
        required: ['trigger_sid']
      },
      handler: async (args: any) => {
        await client.deleteUsageTrigger(args.trigger_sid);
        return {
          content: [{
            type: 'text',
            text: 'Usage trigger deleted successfully'
          }]
        };
      }
    },

    twilio_get_sms_usage: {
      description: 'Get SMS usage statistics',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' }
        }
      },
      handler: async (args: any) => {
        const result = await client.getUsage({
          ...args,
          category: 'sms'
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_call_usage: {
      description: 'Get voice call usage statistics',
      inputSchema: {
        type: 'object',
        properties: {
          start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' }
        }
      },
      handler: async (args: any) => {
        const result = await client.getUsage({
          ...args,
          category: 'calls'
        });
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

