/**
 * Twilio Tool Definitions Part 2 (65 remaining tools)
 * Continuing from twilio-tools.ts
 */

export const TWILIO_TOOLS_2 = [
  // ============================================================
  // VOICE & CALLS (18 more tools, continuing from part 1)
  // ============================================================

  {
    name: 'twilio_list_calls',
    description: 'List calls with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Filter by recipient number' },
        from: { type: 'string', description: 'Filter by caller number' },
        status: { type: 'string', description: 'Filter by status (queued, ringing, in-progress, completed, failed)' },
        startTime: { type: 'string', description: 'Filter by start time (YYYY-MM-DD)' },
        limit: { type: 'number', description: 'Maximum number of calls to return' },
      },
    },
  },
  {
    name: 'twilio_update_call',
    description: 'Update a call in progress',
    inputSchema: {
      type: 'object',
      properties: {
        callSid: { type: 'string', description: 'Call SID' },
        url: { type: 'string', description: 'New TwiML URL' },
        method: { type: 'string', description: 'HTTP method (GET or POST)' },
        status: { type: 'string', description: 'New status (completed to hang up)' },
      },
      required: ['callSid'],
    },
  },
  {
    name: 'twilio_delete_call',
    description: 'Delete a call record',
    inputSchema: {
      type: 'object',
      properties: {
        callSid: { type: 'string', description: 'Call SID to delete' },
      },
      required: ['callSid'],
    },
  },
  {
    name: 'twilio_create_conference',
    description: 'Create a conference',
    inputSchema: {
      type: 'object',
      properties: {
        friendlyName: { type: 'string', description: 'Conference friendly name' },
        statusCallback: { type: 'string', description: 'Webhook URL for status updates' },
      },
      required: ['friendlyName'],
    },
  },
  {
    name: 'twilio_get_conference',
    description: 'Get conference details',
    inputSchema: {
      type: 'object',
      properties: {
        conferenceSid: { type: 'string', description: 'Conference SID' },
      },
      required: ['conferenceSid'],
    },
  },
  {
    name: 'twilio_list_conferences',
    description: 'List conferences',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status (init, in-progress, completed)' },
        friendlyName: { type: 'string', description: 'Filter by friendly name' },
        limit: { type: 'number', description: 'Maximum number to return' },
      },
    },
  },
  {
    name: 'twilio_update_conference',
    description: 'Update a conference',
    inputSchema: {
      type: 'object',
      properties: {
        conferenceSid: { type: 'string', description: 'Conference SID' },
        status: { type: 'string', description: 'New status (completed to end)' },
        announceUrl: { type: 'string', description: 'URL for announcement audio' },
      },
      required: ['conferenceSid'],
    },
  },
  {
    name: 'twilio_list_conference_participants',
    description: 'List participants in a conference',
    inputSchema: {
      type: 'object',
      properties: {
        conferenceSid: { type: 'string', description: 'Conference SID' },
      },
      required: ['conferenceSid'],
    },
  },
  {
    name: 'twilio_get_conference_participant',
    description: 'Get conference participant details',
    inputSchema: {
      type: 'object',
      properties: {
        conferenceSid: { type: 'string', description: 'Conference SID' },
        callSid: { type: 'string', description: 'Participant call SID' },
      },
      required: ['conferenceSid', 'callSid'],
    },
  },
  {
    name: 'twilio_update_conference_participant',
    description: 'Update a conference participant (mute, hold, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        conferenceSid: { type: 'string', description: 'Conference SID' },
        callSid: { type: 'string', description: 'Participant call SID' },
        muted: { type: 'boolean', description: 'Mute/unmute participant' },
        hold: { type: 'boolean', description: 'Hold/unhold participant' },
      },
      required: ['conferenceSid', 'callSid'],
    },
  },
  {
    name: 'twilio_remove_conference_participant',
    description: 'Remove a participant from a conference',
    inputSchema: {
      type: 'object',
      properties: {
        conferenceSid: { type: 'string', description: 'Conference SID' },
        callSid: { type: 'string', description: 'Participant call SID to remove' },
      },
      required: ['conferenceSid', 'callSid'],
    },
  },
  {
    name: 'twilio_get_recording',
    description: 'Get recording details',
    inputSchema: {
      type: 'object',
      properties: {
        recordingSid: { type: 'string', description: 'Recording SID' },
      },
      required: ['recordingSid'],
    },
  },
  {
    name: 'twilio_list_recordings',
    description: 'List recordings',
    inputSchema: {
      type: 'object',
      properties: {
        callSid: { type: 'string', description: 'Filter by call SID' },
        conferenceSid: { type: 'string', description: 'Filter by conference SID' },
        dateCreated: { type: 'string', description: 'Filter by date created' },
        limit: { type: 'number', description: 'Maximum number to return' },
      },
    },
  },
  {
    name: 'twilio_delete_recording',
    description: 'Delete a recording',
    inputSchema: {
      type: 'object',
      properties: {
        recordingSid: { type: 'string', description: 'Recording SID to delete' },
      },
      required: ['recordingSid'],
    },
  },
  {
    name: 'twilio_get_transcription',
    description: 'Get recording transcription',
    inputSchema: {
      type: 'object',
      properties: {
        transcriptionSid: { type: 'string', description: 'Transcription SID' },
      },
      required: ['transcriptionSid'],
    },
  },
  {
    name: 'twilio_list_transcriptions',
    description: 'List transcriptions',
    inputSchema: {
      type: 'object',
      properties: {
        recordingSid: { type: 'string', description: 'Filter by recording SID' },
        limit: { type: 'number', description: 'Maximum number to return' },
      },
    },
  },
  {
    name: 'twilio_delete_transcription',
    description: 'Delete a transcription',
    inputSchema: {
      type: 'object',
      properties: {
        transcriptionSid: { type: 'string', description: 'Transcription SID to delete' },
      },
      required: ['transcriptionSid'],
    },
  },

  // ============================================================
  // PHONE NUMBERS (15 tools)
  // ============================================================

  {
    name: 'twilio_search_available_numbers',
    description: 'Search for available phone numbers',
    inputSchema: {
      type: 'object',
      properties: {
        countryCode: { type: 'string', description: 'Country code (e.g., US, GB)' },
        areaCode: { type: 'string', description: 'Area code to search in' },
        contains: { type: 'string', description: 'Digits the number must contain' },
        smsEnabled: { type: 'boolean', description: 'Filter by SMS capability' },
        voiceEnabled: { type: 'boolean', description: 'Filter by voice capability' },
        limit: { type: 'number', description: 'Maximum number of results' },
      },
      required: ['countryCode'],
    },
  },
  {
    name: 'twilio_buy_phone_number',
    description: 'Purchase a phone number',
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', description: 'Phone number to purchase (E.164 format)' },
        friendlyName: { type: 'string', description: 'Friendly name for the number' },
        smsUrl: { type: 'string', description: 'Webhook URL for incoming SMS' },
        voiceUrl: { type: 'string', description: 'Webhook URL for incoming calls' },
      },
      required: ['phoneNumber'],
    },
  },
  {
    name: 'twilio_get_phone_number',
    description: 'Get phone number details',
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumberSid: { type: 'string', description: 'Phone number SID' },
      },
      required: ['phoneNumberSid'],
    },
  },
  {
    name: 'twilio_list_phone_numbers',
    description: 'List all phone numbers in account',
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', description: 'Filter by phone number' },
        friendlyName: { type: 'string', description: 'Filter by friendly name' },
        limit: { type: 'number', description: 'Maximum number to return' },
      },
    },
  },
  {
    name: 'twilio_update_phone_number',
    description: 'Update phone number configuration',
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumberSid: { type: 'string', description: 'Phone number SID' },
        friendlyName: { type: 'string', description: 'New friendly name' },
        smsUrl: { type: 'string', description: 'New SMS webhook URL' },
        voiceUrl: { type: 'string', description: 'New voice webhook URL' },
        statusCallback: { type: 'string', description: 'Status callback URL' },
      },
      required: ['phoneNumberSid'],
    },
  },
  {
    name: 'twilio_delete_phone_number',
    description: 'Release a phone number',
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumberSid: { type: 'string', description: 'Phone number SID to release' },
      },
      required: ['phoneNumberSid'],
    },
  },
  {
    name: 'twilio_list_toll_free_numbers',
    description: 'Search for available toll-free numbers',
    inputSchema: {
      type: 'object',
      properties: {
        countryCode: { type: 'string', description: 'Country code (default: US)' },
        contains: { type: 'string', description: 'Digits the number must contain' },
        limit: { type: 'number', description: 'Maximum number of results' },
      },
    },
  },
  {
    name: 'twilio_list_local_numbers',
    description: 'Search for available local numbers',
    inputSchema: {
      type: 'object',
      properties: {
        countryCode: { type: 'string', description: 'Country code' },
        areaCode: { type: 'string', description: 'Area code' },
        limit: { type: 'number', description: 'Maximum number of results' },
      },
      required: ['countryCode'],
    },
  },
  {
    name: 'twilio_list_mobile_numbers',
    description: 'Search for available mobile numbers',
    inputSchema: {
      type: 'object',
      properties: {
        countryCode: { type: 'string', description: 'Country code' },
        limit: { type: 'number', description: 'Maximum number of results' },
      },
      required: ['countryCode'],
    },
  },
  {
    name: 'twilio_lookup_phone_number',
    description: 'Lookup phone number information (carrier, type, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', description: 'Phone number to lookup' },
        type: { type: 'array', items: { type: 'string' }, description: 'Data types to return (carrier, caller-name)' },
      },
      required: ['phoneNumber'],
    },
  },
  {
    name: 'twilio_port_phone_number',
    description: 'Port an existing phone number to Twilio',
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumber: { type: 'string', description: 'Phone number to port' },
        losingCarrier: { type: 'string', description: 'Current carrier name' },
        accountNumber: { type: 'string', description: 'Account number with current carrier' },
      },
      required: ['phoneNumber', 'losingCarrier'],
    },
  },
  {
    name: 'twilio_get_port_request',
    description: 'Get port request status',
    inputSchema: {
      type: 'object',
      properties: {
        portRequestSid: { type: 'string', description: 'Port request SID' },
      },
      required: ['portRequestSid'],
    },
  },
  {
    name: 'twilio_list_port_requests',
    description: 'List all port requests',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status' },
        limit: { type: 'number', description: 'Maximum number to return' },
      },
    },
  },
  {
    name: 'twilio_cancel_port_request',
    description: 'Cancel a port request',
    inputSchema: {
      type: 'object',
      properties: {
        portRequestSid: { type: 'string', description: 'Port request SID to cancel' },
      },
      required: ['portRequestSid'],
    },
  },

  // ============================================================
  // VERIFY (10 tools)
  // ============================================================

  {
    name: 'twilio_create_verification',
    description: 'Send a verification code',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Phone number or email to verify' },
        channel: { type: 'string', description: 'Delivery channel (sms, call, email, whatsapp)', enum: ['sms', 'call', 'email', 'whatsapp'] },
        locale: { type: 'string', description: 'Language for the message (e.g., en, es)' },
      },
      required: ['to', 'channel'],
    },
  },
  {
    name: 'twilio_check_verification',
    description: 'Verify a code',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Phone number or email being verified' },
        code: { type: 'string', description: 'Verification code to check' },
      },
      required: ['to', 'code'],
    },
  },
  {
    name: 'twilio_create_verify_service',
    description: 'Create a verification service',
    inputSchema: {
      type: 'object',
      properties: {
        friendlyName: { type: 'string', description: 'Service friendly name' },
        codeLength: { type: 'number', description: 'Verification code length (4-10)' },
      },
      required: ['friendlyName'],
    },
  },
  {
    name: 'twilio_get_verify_service',
    description: 'Get verification service details',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Verification service SID' },
      },
      required: ['serviceSid'],
    },
  },
  {
    name: 'twilio_list_verify_services',
    description: 'List all verification services',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number to return' },
      },
    },
  },
  {
    name: 'twilio_update_verify_service',
    description: 'Update a verification service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Verification service SID' },
        friendlyName: { type: 'string', description: 'New friendly name' },
        codeLength: { type: 'number', description: 'New code length' },
      },
      required: ['serviceSid'],
    },
  },
  {
    name: 'twilio_delete_verify_service',
    description: 'Delete a verification service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Verification service SID to delete' },
      },
      required: ['serviceSid'],
    },
  },
  {
    name: 'twilio_create_rate_limit',
    description: 'Create a rate limit for verification service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Verification service SID' },
        uniqueName: { type: 'string', description: 'Unique name for rate limit' },
        description: { type: 'string', description: 'Rate limit description' },
      },
      required: ['serviceSid', 'uniqueName'],
    },
  },
  {
    name: 'twilio_list_rate_limits',
    description: 'List rate limits for a verification service',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Verification service SID' },
      },
      required: ['serviceSid'],
    },
  },
  {
    name: 'twilio_delete_rate_limit',
    description: 'Delete a rate limit',
    inputSchema: {
      type: 'object',
      properties: {
        serviceSid: { type: 'string', description: 'Verification service SID' },
        rateLimitSid: { type: 'string', description: 'Rate limit SID to delete' },
      },
      required: ['serviceSid', 'rateLimitSid'],
    },
  },

  // ============================================================
  // PROGRAMMABLE VIDEO (10 tools)
  // ============================================================

  {
    name: 'twilio_create_video_room',
    description: 'Create a video room',
    inputSchema: {
      type: 'object',
      properties: {
        uniqueName: { type: 'string', description: 'Unique room name' },
        type: { type: 'string', description: 'Room type (group, peer-to-peer, group-small)', enum: ['group', 'peer-to-peer', 'group-small'] },
        maxParticipants: { type: 'number', description: 'Maximum participants (1-50)' },
        recordParticipantsOnConnect: { type: 'boolean', description: 'Auto-record participants' },
      },
    },
  },
  {
    name: 'twilio_get_video_room',
    description: 'Get video room details',
    inputSchema: {
      type: 'object',
      properties: {
        roomSid: { type: 'string', description: 'Room SID or unique name' },
      },
      required: ['roomSid'],
    },
  },
  {
    name: 'twilio_list_video_rooms',
    description: 'List video rooms',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status (in-progress, completed)' },
        uniqueName: { type: 'string', description: 'Filter by unique name' },
        limit: { type: 'number', description: 'Maximum number to return' },
      },
    },
  },
  {
    name: 'twilio_complete_video_room',
    description: 'Complete (end) a video room',
    inputSchema: {
      type: 'object',
      properties: {
        roomSid: { type: 'string', description: 'Room SID to complete' },
      },
      required: ['roomSid'],
    },
  },
  {
    name: 'twilio_list_video_participants',
    description: 'List participants in a video room',
    inputSchema: {
      type: 'object',
      properties: {
        roomSid: { type: 'string', description: 'Room SID' },
        status: { type: 'string', description: 'Filter by status (connected, disconnected)' },
      },
      required: ['roomSid'],
    },
  },
  {
    name: 'twilio_get_video_participant',
    description: 'Get video participant details',
    inputSchema: {
      type: 'object',
      properties: {
        roomSid: { type: 'string', description: 'Room SID' },
        participantSid: { type: 'string', description: 'Participant SID' },
      },
      required: ['roomSid', 'participantSid'],
    },
  },
  {
    name: 'twilio_update_video_participant',
    description: 'Update video participant status',
    inputSchema: {
      type: 'object',
      properties: {
        roomSid: { type: 'string', description: 'Room SID' },
        participantSid: { type: 'string', description: 'Participant SID' },
        status: { type: 'string', description: 'New status (disconnected to remove)' },
      },
      required: ['roomSid', 'participantSid'],
    },
  },
  {
    name: 'twilio_list_video_recordings',
    description: 'List video recordings',
    inputSchema: {
      type: 'object',
      properties: {
        roomSid: { type: 'string', description: 'Filter by room SID' },
        status: { type: 'string', description: 'Filter by status (processing, completed, deleted)' },
        limit: { type: 'number', description: 'Maximum number to return' },
      },
    },
  },
  {
    name: 'twilio_get_video_recording',
    description: 'Get video recording details',
    inputSchema: {
      type: 'object',
      properties: {
        recordingSid: { type: 'string', description: 'Recording SID' },
      },
      required: ['recordingSid'],
    },
  },
  {
    name: 'twilio_delete_video_recording',
    description: 'Delete a video recording',
    inputSchema: {
      type: 'object',
      properties: {
        recordingSid: { type: 'string', description: 'Recording SID to delete' },
      },
      required: ['recordingSid'],
    },
  },

  // ============================================================
  // CONVERSATIONS (10 tools)
  // ============================================================

  {
    name: 'twilio_create_conversation',
    description: 'Create a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        friendlyName: { type: 'string', description: 'Conversation friendly name' },
        uniqueName: { type: 'string', description: 'Unique conversation name' },
      },
    },
  },
  {
    name: 'twilio_get_conversation',
    description: 'Get conversation details',
    inputSchema: {
      type: 'object',
      properties: {
        conversationSid: { type: 'string', description: 'Conversation SID or unique name' },
      },
      required: ['conversationSid'],
    },
  },
  {
    name: 'twilio_list_conversations',
    description: 'List all conversations',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number to return' },
      },
    },
  },
  {
    name: 'twilio_update_conversation',
    description: 'Update a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationSid: { type: 'string', description: 'Conversation SID' },
        friendlyName: { type: 'string', description: 'New friendly name' },
        state: { type: 'string', description: 'New state (active, inactive, closed)' },
      },
      required: ['conversationSid'],
    },
  },
  {
    name: 'twilio_delete_conversation',
    description: 'Delete a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationSid: { type: 'string', description: 'Conversation SID to delete' },
      },
      required: ['conversationSid'],
    },
  },
  {
    name: 'twilio_add_conversation_participant',
    description: 'Add a participant to a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationSid: { type: 'string', description: 'Conversation SID' },
        identity: { type: 'string', description: 'Participant identity' },
        messagingBindingAddress: { type: 'string', description: 'Phone number or address' },
      },
      required: ['conversationSid'],
    },
  },
  {
    name: 'twilio_list_conversation_participants',
    description: 'List participants in a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationSid: { type: 'string', description: 'Conversation SID' },
      },
      required: ['conversationSid'],
    },
  },
  {
    name: 'twilio_remove_conversation_participant',
    description: 'Remove a participant from a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationSid: { type: 'string', description: 'Conversation SID' },
        participantSid: { type: 'string', description: 'Participant SID to remove' },
      },
      required: ['conversationSid', 'participantSid'],
    },
  },
  {
    name: 'twilio_send_conversation_message',
    description: 'Send a message in a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationSid: { type: 'string', description: 'Conversation SID' },
        body: { type: 'string', description: 'Message body' },
        author: { type: 'string', description: 'Message author identity' },
      },
      required: ['conversationSid', 'body'],
    },
  },
  {
    name: 'twilio_list_conversation_messages',
    description: 'List messages in a conversation',
    inputSchema: {
      type: 'object',
      properties: {
        conversationSid: { type: 'string', description: 'Conversation SID' },
        limit: { type: 'number', description: 'Maximum number to return' },
      },
      required: ['conversationSid'],
    },
  },
];

