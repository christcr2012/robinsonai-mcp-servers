import { z } from 'zod';
import { ResendClient } from '../client.js';
import { CreateBroadcastSchema } from '../types.js';

export function createBroadcastTools(client: ResendClient) {
  return {
    resend_create_broadcast: {
      description: 'Send a broadcast email to an entire audience',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Broadcast name' },
          audience_id: { type: 'string', description: 'Audience ID to send to' },
          from: { type: 'string', description: 'Sender email address' },
          subject: { type: 'string', description: 'Email subject' },
          html: { type: 'string', description: 'HTML content' },
          text: { type: 'string', description: 'Plain text content' },
          reply_to: { type: 'string', description: 'Reply-to address' },
          scheduled_at: { type: 'string', description: 'ISO 8601 datetime to schedule broadcast' }
        },
        required: ['name', 'audience_id', 'from', 'subject']
      },
      handler: async (args: any) => {
        const validated = CreateBroadcastSchema.parse(args);

        // Get all contacts in the audience
        const contacts = await client.listContacts(validated.audience_id);

        // Filter out unsubscribed contacts
        const contactsData = (contacts as any).data || [];
        const activeContacts = Array.isArray(contactsData)
          ? contactsData.filter((c: any) => !c.unsubscribed)
          : [];

        // Create batch email for all active contacts
        const emails = activeContacts.map((contact: any) => ({
          from: validated.from,
          to: contact.email,
          subject: validated.subject,
          html: validated.html,
          text: validated.text,
          reply_to: validated.reply_to,
          tags: [
            { name: 'broadcast_name', value: validated.name },
            { name: 'audience_id', value: validated.audience_id }
          ]
        }));

        const result = await client.createBroadcast(emails);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              broadcast_name: validated.name,
              audience_id: validated.audience_id,
              total_contacts: activeContacts.length,
              result
            }, null, 2)
          }]
        };
      }
    },

    resend_get_broadcast: {
      description: 'Retrieve a broadcast by ID',
      inputSchema: {
        type: 'object',
        properties: {
          broadcast_id: { type: 'string', description: 'Broadcast ID' }
        },
        required: ['broadcast_id']
      },
      handler: async (args: any) => {
        const response = await fetch(`https://api.resend.com/broadcasts/${args.broadcast_id}`, {
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
      }
    },

    resend_update_broadcast: {
      description: 'Update a broadcast',
      inputSchema: {
        type: 'object',
        properties: {
          broadcast_id: { type: 'string', description: 'Broadcast ID' },
          name: { type: 'string', description: 'Broadcast name' },
          subject: { type: 'string', description: 'Email subject' },
          html: { type: 'string', description: 'HTML content' },
          text: { type: 'string', description: 'Plain text content' },
          scheduled_at: { type: 'string', description: 'ISO 8601 datetime to schedule broadcast' }
        },
        required: ['broadcast_id']
      },
      handler: async (args: any) => {
        const { broadcast_id, ...body } = args;
        const response = await fetch(`https://api.resend.com/broadcasts/${broadcast_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      }
    },

    resend_delete_broadcast: {
      description: 'Delete a broadcast',
      inputSchema: {
        type: 'object',
        properties: {
          broadcast_id: { type: 'string', description: 'Broadcast ID to delete' }
        },
        required: ['broadcast_id']
      },
      handler: async (args: any) => {
        const response = await fetch(`https://api.resend.com/broadcasts/${args.broadcast_id}`, {
          method: 'DELETE',
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
      }
    },

    resend_list_broadcasts: {
      description: 'List all broadcasts',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of broadcasts to return' }
        }
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        if (args.limit) params.append('limit', args.limit.toString());

        const response = await fetch(`https://api.resend.com/broadcasts?${params}`, {
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
      }
    },

    resend_send_to_segment: {
      description: 'Send email to a filtered segment of an audience',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Campaign name' },
          audience_id: { type: 'string', description: 'Audience ID' },
          from: { type: 'string', description: 'Sender email address' },
          subject: { type: 'string', description: 'Email subject' },
          html: { type: 'string', description: 'HTML content' },
          text: { type: 'string', description: 'Plain text content' },
          filter_emails: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific email addresses to send to (subset of audience)'
          }
        },
        required: ['name', 'audience_id', 'from', 'subject', 'filter_emails']
      },
      handler: async (args: any) => {
        const emails = args.filter_emails.map((email: string) => ({
          from: args.from,
          to: email,
          subject: args.subject,
          html: args.html,
          text: args.text,
          tags: [
            { name: 'campaign_name', value: args.name },
            { name: 'audience_id', value: args.audience_id },
            { name: 'segment', value: 'filtered' }
          ]
        }));

        const result = await client.createBroadcast(emails);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              campaign_name: args.name,
              audience_id: args.audience_id,
              total_recipients: args.filter_emails.length,
              result
            }, null, 2)
          }]
        };
      }
    }
  };
}
