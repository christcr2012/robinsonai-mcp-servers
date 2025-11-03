import { ResendClient } from '../client.js';

export function createTopicTools(client: ResendClient) {
  const resend = client.getClient();
  
  return {
    resend_create_topic: {
      description: 'Create a new topic',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Topic name' },
          description: { type: 'string', description: 'Topic description' },
        },
        required: ['name'],
      },
      handler: async (args: { name: string; description?: string }) => {
        const response = await fetch('https://api.resend.com/topics', {
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

    resend_get_topic: {
      description: 'Retrieve a topic by ID',
      inputSchema: {
        type: 'object',
        properties: {
          topic_id: { type: 'string', description: 'Topic ID' },
        },
        required: ['topic_id'],
      },
      handler: async (args: { topic_id: string }) => {
        const response = await fetch(`https://api.resend.com/topics/${args.topic_id}`, {
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

    resend_update_topic: {
      description: 'Update a topic',
      inputSchema: {
        type: 'object',
        properties: {
          topic_id: { type: 'string', description: 'Topic ID' },
          name: { type: 'string', description: 'Topic name' },
          description: { type: 'string', description: 'Topic description' },
        },
        required: ['topic_id'],
      },
      handler: async (args: { topic_id: string; name?: string; description?: string }) => {
        const { topic_id, ...body } = args;
        const response = await fetch(`https://api.resend.com/topics/${topic_id}`, {
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

    resend_delete_topic: {
      description: 'Delete a topic',
      inputSchema: {
        type: 'object',
        properties: {
          topic_id: { type: 'string', description: 'Topic ID to delete' },
        },
        required: ['topic_id'],
      },
      handler: async (args: { topic_id: string }) => {
        const response = await fetch(`https://api.resend.com/topics/${args.topic_id}`, {
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

    resend_list_topics: {
      description: 'List all topics',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const response = await fetch('https://api.resend.com/topics', {
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

