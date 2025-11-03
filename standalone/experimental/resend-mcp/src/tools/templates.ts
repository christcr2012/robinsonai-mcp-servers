import { ResendClient } from '../client.js';

export function createTemplateTools(client: ResendClient) {
  const resend = client.getClient();
  
  return {
    resend_create_template: {
      description: 'Create a new email template',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Template name' },
          subject: { type: 'string', description: 'Email subject' },
          html: { type: 'string', description: 'HTML content' },
          text: { type: 'string', description: 'Plain text content' },
        },
        required: ['name', 'subject'],
      },
      handler: async (args: { name: string; subject: string; html?: string; text?: string }) => {
        const response = await fetch('https://api.resend.com/templates', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(args)
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

    resend_get_template: {
      description: 'Get a template by ID',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'Template ID' },
        },
        required: ['template_id'],
      },
      handler: async (args: { template_id: string }) => {
        const response = await fetch(`https://api.resend.com/templates/${args.template_id}`, {
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

    resend_update_template: {
      description: 'Update a template',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'Template ID' },
          name: { type: 'string', description: 'Template name' },
          subject: { type: 'string', description: 'Email subject' },
          html: { type: 'string', description: 'HTML content' },
          text: { type: 'string', description: 'Plain text content' },
        },
        required: ['template_id'],
      },
      handler: async (args: { template_id: string; name?: string; subject?: string; html?: string; text?: string }) => {
        const { template_id, ...body } = args;
        const response = await fetch(`https://api.resend.com/templates/${template_id}`, {
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
      },
    },

    resend_publish_template: {
      description: 'Publish a template',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'Template ID to publish' },
        },
        required: ['template_id'],
      },
      handler: async (args: { template_id: string }) => {
        const response = await fetch(`https://api.resend.com/templates/${args.template_id}/publish`, {
          method: 'POST',
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

    resend_duplicate_template: {
      description: 'Duplicate a template',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'Template ID to duplicate' },
          name: { type: 'string', description: 'Name for the duplicated template' },
        },
        required: ['template_id'],
      },
      handler: async (args: { template_id: string; name?: string }) => {
        const response = await fetch(`https://api.resend.com/templates/${args.template_id}/duplicate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: args.name })
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

    resend_delete_template: {
      description: 'Delete a template',
      inputSchema: {
        type: 'object',
        properties: {
          template_id: { type: 'string', description: 'Template ID to delete' },
        },
        required: ['template_id'],
      },
      handler: async (args: { template_id: string }) => {
        const response = await fetch(`https://api.resend.com/templates/${args.template_id}`, {
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
      },
    },

    resend_list_templates: {
      description: 'List all templates',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of templates to return' },
        },
      },
      handler: async (args: { limit?: number }) => {
        const params = new URLSearchParams();
        if (args.limit) params.append('limit', args.limit.toString());
        
        const response = await fetch(`https://api.resend.com/templates?${params}`, {
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
  };
}

