import { z } from 'zod';
import { ResendClient } from '../client.js';
import { CreateContactSchema, UpdateContactSchema } from '../types.js';

export function createContactTools(client: ResendClient) {
  return {
    resend_create_contact: {
      description: 'Add a contact to an audience',
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Contact email address' },
          first_name: { type: 'string', description: 'Contact first name' },
          last_name: { type: 'string', description: 'Contact last name' },
          unsubscribed: { type: 'boolean', description: 'Whether contact is unsubscribed' },
          audience_id: { type: 'string', description: 'Audience ID to add contact to' }
        },
        required: ['email', 'audience_id']
      },
      handler: async (args: any) => {
        const validated = CreateContactSchema.parse(args);
        const result = await client.createContact(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_get_contact: {
      description: 'Get details of a specific contact',
      inputSchema: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact ID' },
          audience_id: { type: 'string', description: 'Audience ID' }
        },
        required: ['contact_id', 'audience_id']
      },
      handler: async (args: any) => {
        const result = await client.getContact(args.contact_id, args.audience_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_list_contacts: {
      description: 'List all contacts in an audience',
      inputSchema: {
        type: 'object',
        properties: {
          audience_id: { type: 'string', description: 'Audience ID' }
        },
        required: ['audience_id']
      },
      handler: async (args: any) => {
        const result = await client.listContacts(args.audience_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_update_contact: {
      description: 'Update a contact in an audience',
      inputSchema: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact ID' },
          audience_id: { type: 'string', description: 'Audience ID' },
          first_name: { type: 'string', description: 'Contact first name' },
          last_name: { type: 'string', description: 'Contact last name' },
          unsubscribed: { type: 'boolean', description: 'Whether contact is unsubscribed' }
        },
        required: ['contact_id', 'audience_id']
      },
      handler: async (args: any) => {
        const validated = UpdateContactSchema.parse(args);
        const { contact_id, audience_id, ...params } = validated;
        const result = await client.updateContact(contact_id, audience_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_delete_contact: {
      description: 'Remove a contact from an audience',
      inputSchema: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact ID' },
          audience_id: { type: 'string', description: 'Audience ID' }
        },
        required: ['contact_id', 'audience_id']
      },
      handler: async (args: any) => {
        const result = await client.deleteContact(args.contact_id, args.audience_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_bulk_create_contacts: {
      description: 'Add multiple contacts to an audience at once',
      inputSchema: {
        type: 'object',
        properties: {
          audience_id: { type: 'string', description: 'Audience ID' },
          contacts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                unsubscribed: { type: 'boolean' }
              },
              required: ['email']
            },
            description: 'Array of contacts to add'
          }
        },
        required: ['audience_id', 'contacts']
      },
      handler: async (args: any) => {
        const results = [];
        for (const contact of args.contacts) {
          const result = await client.createContact({
            ...contact,
            audience_id: args.audience_id
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

    resend_get_contact_topics: {
      description: 'Retrieve contact topics',
      inputSchema: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact ID' },
          audience_id: { type: 'string', description: 'Audience ID' }
        },
        required: ['contact_id', 'audience_id']
      },
      handler: async (args: any) => {
        const response = await fetch(
          `https://api.resend.com/audiences/${args.audience_id}/contacts/${args.contact_id}/topics`,
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
      }
    },

    resend_update_contact_topic: {
      description: 'Update contact topic subscription',
      inputSchema: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'Contact ID' },
          audience_id: { type: 'string', description: 'Audience ID' },
          topic_id: { type: 'string', description: 'Topic ID' },
          subscribed: { type: 'boolean', description: 'Subscription status' }
        },
        required: ['contact_id', 'audience_id', 'topic_id', 'subscribed']
      },
      handler: async (args: any) => {
        const { contact_id, audience_id, topic_id, subscribed } = args;
        const response = await fetch(
          `https://api.resend.com/audiences/${audience_id}/contacts/${contact_id}/topics/${topic_id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subscribed })
          }
        );
        const data = await response.json();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        };
      }
    }
  };
}
