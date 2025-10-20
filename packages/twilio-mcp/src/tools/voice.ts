import { z } from 'zod';
import { TwilioClient } from '../client.js';
import { MakeCallSchema } from '../types.js';

export function createVoiceTools(client: TwilioClient) {
  return {
    twilio_make_call: {
      description: 'Make an outbound voice call',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient phone number' },
          from: { type: 'string', description: 'Caller phone number' },
          url: { type: 'string', description: 'TwiML URL for call instructions' },
          twiml: { type: 'string', description: 'TwiML instructions (alternative to url)' },
          status_callback: { type: 'string', description: 'Webhook URL for status updates' },
          status_callback_event: {
            type: 'array',
            items: { type: 'string' },
            description: 'Events to trigger callbacks (initiated, ringing, answered, completed)'
          },
          timeout: { type: 'number', description: 'Ring timeout in seconds' },
          record: { type: 'boolean', description: 'Record the call' },
          recording_status_callback: { type: 'string', description: 'Recording status webhook URL' }
        },
        required: ['to', 'from']
      },
      handler: async (args: any) => {
        const validated = MakeCallSchema.parse(args);
        const result = await client.makeCall(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_call: {
      description: 'Get details of a call',
      inputSchema: {
        type: 'object',
        properties: {
          call_sid: { type: 'string', description: 'Call SID' }
        },
        required: ['call_sid']
      },
      handler: async (args: any) => {
        const result = await client.getCall(args.call_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_list_calls: {
      description: 'List calls with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Filter by recipient phone number' },
          from: { type: 'string', description: 'Filter by caller phone number' },
          status: {
            type: 'string',
            enum: ['queued', 'ringing', 'in-progress', 'completed', 'busy', 'failed', 'no-answer', 'canceled'],
            description: 'Filter by call status'
          },
          start_time: { type: 'string', description: 'Filter by start time (YYYY-MM-DD)' },
          limit: { type: 'number', description: 'Maximum number of calls to return' }
        }
      },
      handler: async (args: any) => {
        const result = await client.listCalls(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_update_call: {
      description: 'Update an in-progress call (redirect, cancel, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          call_sid: { type: 'string', description: 'Call SID' },
          url: { type: 'string', description: 'New TwiML URL to redirect call' },
          twiml: { type: 'string', description: 'New TwiML instructions' },
          status: {
            type: 'string',
            enum: ['canceled', 'completed'],
            description: 'Update call status (cancel or complete)'
          }
        },
        required: ['call_sid']
      },
      handler: async (args: any) => {
        const { call_sid, ...params } = args;
        const result = await client.updateCall(call_sid, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_delete_call: {
      description: 'Delete a call record',
      inputSchema: {
        type: 'object',
        properties: {
          call_sid: { type: 'string', description: 'Call SID to delete' }
        },
        required: ['call_sid']
      },
      handler: async (args: any) => {
        await client.deleteCall(args.call_sid);
        return {
          content: [{
            type: 'text',
            text: 'Call record deleted successfully'
          }]
        };
      }
    },

    twilio_get_recording: {
      description: 'Get details of a call recording',
      inputSchema: {
        type: 'object',
        properties: {
          recording_sid: { type: 'string', description: 'Recording SID' }
        },
        required: ['recording_sid']
      },
      handler: async (args: any) => {
        const result = await client.getRecording(args.recording_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_list_recordings: {
      description: 'List call recordings',
      inputSchema: {
        type: 'object',
        properties: {
          call_sid: { type: 'string', description: 'Filter by call SID' },
          date_created: { type: 'string', description: 'Filter by date (YYYY-MM-DD)' },
          limit: { type: 'number', description: 'Maximum number of recordings to return' }
        }
      },
      handler: async (args: any) => {
        const result = await client.listRecordings(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_delete_recording: {
      description: 'Delete a call recording',
      inputSchema: {
        type: 'object',
        properties: {
          recording_sid: { type: 'string', description: 'Recording SID to delete' }
        },
        required: ['recording_sid']
      },
      handler: async (args: any) => {
        await client.deleteRecording(args.recording_sid);
        return {
          content: [{
            type: 'text',
            text: 'Recording deleted successfully'
          }]
        };
      }
    }
  };
}

