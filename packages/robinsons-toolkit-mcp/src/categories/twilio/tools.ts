/**
 * Twilio Tool Definitions (85 tools)
 *
 * Resource Groups:
 * - Messaging: 20 tools (SMS, MMS, WhatsApp, messaging services)
 * - Voice & Calls: 20 tools (calls, conferences, recordings)
 * - Phone Numbers: 15 tools (buy, configure, manage)
 * - Verify: 10 tools (2FA, verification codes)
 * - Programmable Video: 10 tools (rooms, participants)
 * - Conversations: 10 tools (conversations, messages, participants)
 */

import { TWILIO_TOOLS_2 } from './tools-2.js';

const TWILIO_TOOLS_1 = [
  // ============================================================
  // MESSAGING (20 tools)
  // ============================================================

  {
    name: 'twilio_send_sms',
    description: 'Send an SMS message',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient phone number (E.164 format)' },
        from: { type: 'string', description: 'Sender phone number or messaging service SID' },
        body: { type: 'string', description: 'Message body (up to 1600 characters)' },
      },
      required: ['to', 'from', 'body'],
    },
  },
  {
    name: 'twilio_send_mms',
    description: 'Send an MMS message with media',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient phone number' },
        from: { type: 'string', description: 'Sender phone number' },
        body: { type: 'string', description: 'Message body' },
        mediaUrl: { type: 'array', items: { type: 'string' }, description: 'Media URLs (images, videos)' },
      },
      required: ['to', 'from', 'mediaUrl'],
    },
  },
  {
    name: 'twilio_send_whatsapp',
    description: 'Send a WhatsApp message',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient WhatsApp number (whatsapp:+1234567890)' },
        from: { type: 'string', description: 'Sender WhatsApp number' },
        body: { type: 'string', description: 'Message body' },
      },
      required: ['to', 'from', 'body'],
    },
  },
  {
    name: 'twilio_get_message',
    description: 'Get details of a specific message',
    inputSchema: {
      type: 'object',
      properties: {
        messageSid: { type: 'string', description: 'Message SID' },
      },
      required: ['messageSid'],
    },
  },
  {
    name: 'twilio_list_messages',
    description: 'List messages with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Filter by recipient number' },
        from: { type: 'string', description: 'Filter by sender number' },
        dateSent: { type: 'string', description: 'Filter by date sent (YYYY-MM-DD)' },
        limit: { type: 'number', description: 'Maximum number of messages to return' },
      },
    },
  },
  {
    name: 'twilio_delete_message',
    description: 'Delete a message',
    inputSchema: {
      type: 'object',
      properties: {
        messageSid: { type: 'string', description: 'Message SID to delete' },
      },
      required: ['messageSid'],
    },
  },
  {
    name: 'twilio_update_message',
    description: 'Update a message (redact body)',
    inputSchema: {
      type: 'object',
      properties: {
        messageSid: { type: 'string', description: 'Message SID' },
        body: { type: 'string', description: 'New message body (empty to redact)' },
      },
      required: ['messageSid'],
    },
  },
  {
    name: 'twilio_create_messaging_service',
    description: 'Create a messaging service',
    inputSchema: {
      type: 'object',
      properties: {
        friendlyName: { type: 'string', description: 'Service friendly name' },
        inboundRequestUrl: { type: 'string', description: 'Webhook URL for inbound messages' },
        statusCallback: { type: 'string', description: 'Webhook URL for status updates' },
      },
      required: ['friendlyName'],
    },
  },
  {
    name: 'twilio_get_messaging_service',
    description: 'Get messaging service details',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Messaging service SID' },
      },
      required: ['serviceSid'],
    },
  },
  {
    name: 'twilio_list_messaging_services',
    description: 'List all messaging services',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of services to return' },
      },
    },
  },
  {
    name: 'twilio_update_messaging_service',
    description: 'Update a messaging service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Messaging service SID' },
        friendlyName: { type: 'string', description: 'New friendly name' },
        inboundRequestUrl: { type: 'string', description: 'New webhook URL' },
      },
      required: ['serviceSid'],
    },
  },
  {
    name: 'twilio_delete_messaging_service',
    description: 'Delete a messaging service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Messaging service SID' },
      },
      required: ['serviceSid'],
    },
  },
  {
    name: 'twilio_add_phone_to_service',
    description: 'Add a phone number to a messaging service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Messaging service SID' },
        phoneNumberSid: { type: 'string', description: 'Phone number SID to add' },
      },
      required: ['serviceSid', 'phoneNumberSid'],
    },
  },
  {
    name: 'twilio_remove_phone_from_service',
    description: 'Remove a phone number from a messaging service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Messaging service SID' },
        phoneNumberSid: { type: 'string', description: 'Phone number SID to remove' },
      },
      required: ['serviceSid', 'phoneNumberSid'],
    },
  },
  {
    name: 'twilio_list_service_phone_numbers',
    description: 'List phone numbers in a messaging service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Messaging service SID' },
      },
      required: ['serviceSid'],
    },
  },
  {
    name: 'twilio_schedule_message',
    description: 'Schedule a message for future delivery',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient phone number' },
        from: { type: 'string', description: 'Sender phone number' },
        body: { type: 'string', description: 'Message body' },
        sendAt: { type: 'string', description: 'ISO 8601 timestamp for delivery' },
      },
      required: ['to', 'from', 'body', 'sendAt'],
    },
  },
  {
    name: 'twilio_cancel_scheduled_message',
    description: 'Cancel a scheduled message',
    inputSchema: {
      type: 'object',
      properties: {
        messageSid: { type: 'string', description: 'Scheduled message SID' },
      },
      required: ['messageSid'],
    },
  },
  {
    name: 'twilio_get_message_media',
    description: 'Get media from an MMS message',
    inputSchema: {
      type: 'object',
      properties: {
        messageSid: { type: 'string', description: 'Message SID' },
        mediaSid: { type: 'string', description: 'Media SID (optional, returns all if omitted)' },
      },
      required: ['messageSid'],
    },
  },
  {
    name: 'twilio_list_message_media',
    description: 'List all media for a message',
    inputSchema: {
      type: 'object',
      properties: {
        messageSid: { type: 'string', description: 'Message SID' },
      },
      required: ['messageSid'],
    },
  },
  {
    name: 'twilio_delete_message_media',
    description: 'Delete media from a message',
    inputSchema: {
      type: 'object',
      properties: {
        messageSid: { type: 'string', description: 'Message SID' },
        mediaSid: { type: 'string', description: 'Media SID to delete' },
      },
      required: ['messageSid', 'mediaSid'],
    },
  },

  // ============================================================
  // VOICE & CALLS (20 tools)
  // ============================================================

  {
    name: 'twilio_make_call',
    description: 'Make an outbound call',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient phone number' },
        from: { type: 'string', description: 'Caller phone number' },
        url: { type: 'string', description: 'TwiML URL for call instructions' },
        statusCallback: { type: 'string', description: 'Webhook URL for call status updates' },
      },
      required: ['to', 'from', 'url'],
    },
  },
  {
    name: 'twilio_get_call',
    description: 'Get details of a specific call',
    inputSchema: {
      type: 'object',
      properties: {
        callSid: { type: 'string', description: 'Call SID' },
      },
      required: ['callSid'],
    },
  },
];

// Combine all Twilio tools (22 from part 1 + 63 from part 2 = 85 total)
export const TWILIO_TOOLS = [
  ...TWILIO_TOOLS_1,
  ...TWILIO_TOOLS_2,
];

