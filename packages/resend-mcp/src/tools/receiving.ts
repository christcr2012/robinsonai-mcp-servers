import { ResendClient } from '../client.js';

export function createReceivingTools(client: ResendClient) {
  const resend = client.getClient();
  
  return {
    resend_get_received_email: {
      description: 'Retrieve a received email by ID',
      inputSchema: {
        type: 'object',
        properties: {
          email_id: { type: 'string', description: 'Received email ID' },
        },
        required: ['email_id'],
      },
      handler: async (args: { email_id: string }) => {
        // Note: Resend SDK may not have this endpoint yet, using direct API call
        const response = await fetch(`https://api.resend.com/emails/received/${args.email_id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    resend_list_received_emails: {
      description: 'List all received emails',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of emails to return' },
        },
      },
      handler: async (args: { limit?: number }) => {
        const params = new URLSearchParams();
        if (args.limit) params.append('limit', args.limit.toString());
        
        const response = await fetch(`https://api.resend.com/emails/received?${params}`, {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    resend_get_attachment: {
      description: 'Retrieve an attachment from a received email',
      inputSchema: {
        type: 'object',
        properties: {
          email_id: { type: 'string', description: 'Received email ID' },
          attachment_id: { type: 'string', description: 'Attachment ID' },
        },
        required: ['email_id', 'attachment_id'],
      },
      handler: async (args: { email_id: string; attachment_id: string }) => {
        const response = await fetch(
          `https://api.resend.com/emails/received/${args.email_id}/attachments/${args.attachment_id}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const data = await response.json();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },

    resend_list_attachments: {
      description: 'List all attachments for a received email',
      inputSchema: {
        type: 'object',
        properties: {
          email_id: { type: 'string', description: 'Received email ID' },
        },
        required: ['email_id'],
      },
      handler: async (args: { email_id: string }) => {
        const response = await fetch(
          `https://api.resend.com/emails/received/${args.email_id}/attachments`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const data = await response.json();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      },
    },
  };
}

