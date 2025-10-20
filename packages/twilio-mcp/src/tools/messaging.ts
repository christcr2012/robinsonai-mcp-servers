import { z } from 'zod';
import { TwilioClient } from '../client.js';
import { SendSmsSchema, SendMmsSchema } from '../types.js';

export function createMessagingTools(client: TwilioClient) {
  return {
    twilio_send_sms: {
      description: 'Send an SMS message',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient phone number (E.164 format)' },
          from: { type: 'string', description: 'Sender phone number or messaging service SID' },
          body: { type: 'string', description: 'Message body (up to 1600 characters)' },
          status_callback: { type: 'string', description: 'Webhook URL for status updates' },
          max_price: { type: 'string', description: 'Maximum price in USD' },
          validity_period: { type: 'number', description: 'Message validity in seconds' },
          messaging_service_sid: { type: 'string', description: 'Messaging Service SID' }
        },
        required: ['to', 'body']
      },
      handler: async (args: any) => {
        const validated = SendSmsSchema.parse(args);
        const result = await client.sendSms(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_send_mms: {
      description: 'Send an MMS message with media attachments',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient phone number' },
          from: { type: 'string', description: 'Sender phone number' },
          body: { type: 'string', description: 'Message body' },
          media_url: {
            type: 'array',
            items: { type: 'string' },
            description: 'URLs of media files to attach (up to 10)'
          },
          status_callback: { type: 'string', description: 'Webhook URL for status updates' }
        },
        required: ['to', 'from', 'media_url']
      },
      handler: async (args: any) => {
        const validated = SendMmsSchema.parse(args);
        const result = await client.sendSms(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_message: {
      description: 'Get details of a sent/received message',
      inputSchema: {
        type: 'object',
        properties: {
          message_sid: { type: 'string', description: 'Message SID' }
        },
        required: ['message_sid']
      },
      handler: async (args: any) => {
        const result = await client.getMessage(args.message_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_list_messages: {
      description: 'List messages with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Filter by recipient phone number' },
          from: { type: 'string', description: 'Filter by sender phone number' },
          date_sent: { type: 'string', description: 'Filter by date sent (YYYY-MM-DD)' },
          limit: { type: 'number', description: 'Maximum number of messages to return' }
        }
      },
      handler: async (args: any) => {
        const result = await client.listMessages(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_delete_message: {
      description: 'Delete a message record',
      inputSchema: {
        type: 'object',
        properties: {
          message_sid: { type: 'string', description: 'Message SID to delete' }
        },
        required: ['message_sid']
      },
      handler: async (args: any) => {
        const result = await client.deleteMessage(args.message_sid);
        return {
          content: [{
            type: 'text',
            text: 'Message deleted successfully'
          }]
        };
      }
    },

    twilio_send_bulk_sms: {
      description: 'Send SMS to multiple recipients',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Sender phone number' },
          to: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of recipient phone numbers'
          },
          body: { type: 'string', description: 'Message body' }
        },
        required: ['from', 'to', 'body']
      },
      handler: async (args: any) => {
        const results = [];
        for (const recipient of args.to) {
          const result = await client.sendSms({
            to: recipient,
            from: args.from,
            body: args.body
          });
          results.push(result);
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }]
        };
      }
    },

    twilio_create_messaging_service: {
      description: 'Create a messaging service for managing phone numbers',
      inputSchema: {
        type: 'object',
        properties: {
          friendly_name: { type: 'string', description: 'Service name' },
          inbound_request_url: { type: 'string', description: 'Webhook URL for inbound messages' },
          inbound_method: { type: 'string', enum: ['GET', 'POST'], description: 'HTTP method' },
          fallback_url: { type: 'string', description: 'Fallback webhook URL' },
          status_callback: { type: 'string', description: 'Status callback URL' },
          use_inbound_webhook_on_number: { type: 'boolean', description: 'Use number-level webhooks' }
        },
        required: ['friendly_name']
      },
      handler: async (args: any) => {
        const result = await client.createMessagingService(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_list_messaging_services: {
      description: 'List all messaging services',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const result = await client.listMessagingServices();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_messaging_service: {
      description: 'Get details of a messaging service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Messaging Service SID' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        const result = await client.getMessagingService(args.service_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_delete_messaging_service: {
      description: 'Delete a messaging service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Messaging Service SID' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        await client.deleteMessagingService(args.service_sid);
        return {
          content: [{
            type: 'text',
            text: 'Messaging service deleted successfully'
          }]
        };
      }
    }
  };
}

