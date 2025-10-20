import { z } from 'zod';
import { TwilioClient } from '../client.js';

export function createMediaTools(client: TwilioClient) {
  return {
    twilio_list_message_media: {
      description: 'List media files attached to a message',
      inputSchema: {
        type: 'object',
        properties: {
          message_sid: { type: 'string', description: 'Message SID' }
        },
        required: ['message_sid']
      },
      handler: async (args: any) => {
        const result = await client.listMessageMedia(args.message_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_message_media: {
      description: 'Get media file details',
      inputSchema: {
        type: 'object',
        properties: {
          message_sid: { type: 'string', description: 'Message SID' },
          media_sid: { type: 'string', description: 'Media SID' }
        },
        required: ['message_sid', 'media_sid']
      },
      handler: async (args: any) => {
        const result = await client.getMessageMedia(args.message_sid, args.media_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_delete_message_media: {
      description: 'Delete media file from message',
      inputSchema: {
        type: 'object',
        properties: {
          message_sid: { type: 'string', description: 'Message SID' },
          media_sid: { type: 'string', description: 'Media SID' }
        },
        required: ['message_sid', 'media_sid']
      },
      handler: async (args: any) => {
        await client.deleteMessageMedia(args.message_sid, args.media_sid);
        return {
          content: [{
            type: 'text',
            text: 'Media deleted successfully'
          }]
        };
      }
    },

    twilio_create_message_feedback: {
      description: 'Create feedback for a message',
      inputSchema: {
        type: 'object',
        properties: {
          message_sid: { type: 'string', description: 'Message SID' },
          outcome: {
            type: 'string',
            enum: ['confirmed', 'unconfirmed'],
            description: 'Message delivery outcome'
          }
        },
        required: ['message_sid', 'outcome']
      },
      handler: async (args: any) => {
        const result = await client.createMessageFeedback(args.message_sid, args.outcome);
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

