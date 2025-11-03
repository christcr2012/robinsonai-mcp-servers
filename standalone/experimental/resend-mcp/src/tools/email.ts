import { z } from 'zod';
import { ResendClient } from '../client.js';
import { SendEmailSchema } from '../types.js';

export function createEmailTools(client: ResendClient) {
  return {
    resend_send_email: {
      description: 'Send an email using Resend',
      inputSchema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Sender email address (must be from verified domain)' },
          to: { 
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ],
            description: 'Recipient email address(es)' 
          },
          subject: { type: 'string', description: 'Email subject' },
          html: { type: 'string', description: 'HTML content of the email' },
          text: { type: 'string', description: 'Plain text content of the email' },
          cc: { 
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ],
            description: 'CC recipients' 
          },
          bcc: { 
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ],
            description: 'BCC recipients' 
          },
          reply_to: { 
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ],
            description: 'Reply-to address(es)' 
          },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                value: { type: 'string' }
              },
              required: ['name', 'value']
            },
            description: 'Email tags for categorization'
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                content: { type: 'string', description: 'Base64 encoded content' },
                content_type: { type: 'string' }
              },
              required: ['filename', 'content']
            },
            description: 'Email attachments'
          },
          headers: {
            type: 'object',
            description: 'Custom email headers',
            additionalProperties: { type: 'string' }
          },
          scheduled_at: { type: 'string', description: 'ISO 8601 datetime to schedule email' }
        },
        required: ['from', 'to', 'subject']
      },
      handler: async (args: any) => {
        const validated = SendEmailSchema.parse(args);
        const result = await client.sendEmail(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_get_email: {
      description: 'Get details of a sent email by ID',
      inputSchema: {
        type: 'object',
        properties: {
          email_id: { type: 'string', description: 'Email ID to retrieve' }
        },
        required: ['email_id']
      },
      handler: async (args: any) => {
        const result = await client.getEmail(args.email_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_cancel_email: {
      description: 'Cancel a scheduled email',
      inputSchema: {
        type: 'object',
        properties: {
          email_id: { type: 'string', description: 'Email ID to cancel' }
        },
        required: ['email_id']
      },
      handler: async (args: any) => {
        const result = await client.cancelEmail(args.email_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_update_email: {
      description: 'Update a scheduled email',
      inputSchema: {
        type: 'object',
        properties: {
          email_id: { type: 'string', description: 'Email ID to update' },
          scheduled_at: { type: 'string', description: 'New scheduled time (ISO 8601)' }
        },
        required: ['email_id']
      },
      handler: async (args: any) => {
        const { email_id, ...params } = args;
        const result = await client.updateEmail(email_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_send_batch_emails: {
      description: 'Send multiple emails in a batch (up to 100)',
      inputSchema: {
        type: 'object',
        properties: {
          emails: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                from: { type: 'string' },
                to: { 
                  oneOf: [
                    { type: 'string' },
                    { type: 'array', items: { type: 'string' } }
                  ]
                },
                subject: { type: 'string' },
                html: { type: 'string' },
                text: { type: 'string' }
              },
              required: ['from', 'to', 'subject']
            },
            maxItems: 100,
            description: 'Array of emails to send'
          }
        },
        required: ['emails']
      },
      handler: async (args: any) => {
        const result = await client.createBroadcast(args.emails);
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

