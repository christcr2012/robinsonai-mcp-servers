import { z } from 'zod';
import { TwilioClient } from '../client.js';

export function createConferenceTools(client: TwilioClient) {
  return {
    twilio_list_conferences: {
      description: 'List conferences',
      inputSchema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['init', 'in-progress', 'completed'],
            description: 'Filter by conference status'
          },
          date_created: { type: 'string', description: 'Filter by date (YYYY-MM-DD)' },
          friendly_name: { type: 'string', description: 'Filter by friendly name' },
          limit: { type: 'number', description: 'Maximum results' }
        }
      },
      handler: async (args: any) => {
        const result = await client.listConferences(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_conference: {
      description: 'Get conference details',
      inputSchema: {
        type: 'object',
        properties: {
          conference_sid: { type: 'string', description: 'Conference SID' }
        },
        required: ['conference_sid']
      },
      handler: async (args: any) => {
        const result = await client.getConference(args.conference_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_update_conference: {
      description: 'Update conference (end, announce URL)',
      inputSchema: {
        type: 'object',
        properties: {
          conference_sid: { type: 'string', description: 'Conference SID' },
          status: {
            type: 'string',
            enum: ['completed'],
            description: 'Set to completed to end conference'
          },
          announce_url: { type: 'string', description: 'URL for announcement' }
        },
        required: ['conference_sid']
      },
      handler: async (args: any) => {
        const { conference_sid, ...params } = args;
        const result = await client.updateConference(conference_sid, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_list_conference_participants: {
      description: 'List participants in a conference',
      inputSchema: {
        type: 'object',
        properties: {
          conference_sid: { type: 'string', description: 'Conference SID' },
          muted: { type: 'boolean', description: 'Filter by muted status' },
          hold: { type: 'boolean', description: 'Filter by hold status' }
        },
        required: ['conference_sid']
      },
      handler: async (args: any) => {
        const result = await client.listConferenceParticipants(args.conference_sid, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_get_conference_participant: {
      description: 'Get participant details',
      inputSchema: {
        type: 'object',
        properties: {
          conference_sid: { type: 'string', description: 'Conference SID' },
          call_sid: { type: 'string', description: 'Participant call SID' }
        },
        required: ['conference_sid', 'call_sid']
      },
      handler: async (args: any) => {
        const result = await client.getConferenceParticipant(args.conference_sid, args.call_sid);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_update_conference_participant: {
      description: 'Update participant (mute, hold, kick)',
      inputSchema: {
        type: 'object',
        properties: {
          conference_sid: { type: 'string', description: 'Conference SID' },
          call_sid: { type: 'string', description: 'Participant call SID' },
          muted: { type: 'boolean', description: 'Mute/unmute participant' },
          hold: { type: 'boolean', description: 'Hold/unhold participant' },
          announce_url: { type: 'string', description: 'Announcement URL' }
        },
        required: ['conference_sid', 'call_sid']
      },
      handler: async (args: any) => {
        const { conference_sid, call_sid, ...params } = args;
        const result = await client.updateConferenceParticipant(conference_sid, call_sid, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    twilio_remove_conference_participant: {
      description: 'Remove participant from conference',
      inputSchema: {
        type: 'object',
        properties: {
          conference_sid: { type: 'string', description: 'Conference SID' },
          call_sid: { type: 'string', description: 'Participant call SID' }
        },
        required: ['conference_sid', 'call_sid']
      },
      handler: async (args: any) => {
        await client.removeConferenceParticipant(args.conference_sid, args.call_sid);
        return {
          content: [{
            type: 'text',
            text: 'Participant removed from conference'
          }]
        };
      }
    }
  };
}

