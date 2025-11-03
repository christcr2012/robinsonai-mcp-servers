import { TwilioClient } from '../client.js';

export function createVerifyTools(client: TwilioClient) {
  return {
    twilio_create_verification_service: {
      description: 'Create a new Verify service',
      inputSchema: {
        type: 'object',
        properties: {
          friendly_name: { type: 'string', description: 'Friendly name for the service' },
          code_length: { type: 'number', description: 'Length of verification code (4-10)' },
          lookup_enabled: { type: 'boolean', description: 'Enable phone number lookup' },
          skip_sms_to_landlines: { type: 'boolean', description: 'Skip SMS to landlines' },
          dtmf_input_required: { type: 'boolean', description: 'Require DTMF input for voice' },
          tts_name: { type: 'string', description: 'Text-to-speech voice name' }
        },
        required: ['friendly_name']
      },
      handler: async (args: any) => {
        const service = await client.getClient().verify.v2.services.create(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(service, null, 2)
          }]
        };
      }
    },

    twilio_list_verification_services: {
      description: 'List all Verify services',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of services to return' }
        }
      },
      handler: async (args: any) => {
        const services = await client.getClient().verify.v2.services.list({ limit: args.limit });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(services, null, 2)
          }]
        };
      }
    },

    twilio_get_verification_service: {
      description: 'Get details of a Verify service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        const service = await client.getClient().verify.v2.services(args.service_sid).fetch();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(service, null, 2)
          }]
        };
      }
    },

    twilio_update_verification_service: {
      description: 'Update a Verify service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          friendly_name: { type: 'string', description: 'New friendly name' },
          code_length: { type: 'number', description: 'Length of verification code' },
          lookup_enabled: { type: 'boolean', description: 'Enable phone number lookup' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        const { service_sid, ...updateData } = args;
        const service = await client.getClient().verify.v2.services(service_sid).update(updateData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(service, null, 2)
          }]
        };
      }
    },

    twilio_delete_verification_service: {
      description: 'Delete a Verify service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID to delete' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        await client.getClient().verify.v2.services(args.service_sid).remove();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, message: 'Service deleted' }, null, 2)
          }]
        };
      }
    },

    twilio_create_verification: {
      description: 'Start a verification (send code via SMS, voice, or email)',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          to: { type: 'string', description: 'Phone number or email to verify' },
          channel: { type: 'string', enum: ['sms', 'call', 'email', 'whatsapp'], description: 'Verification channel' },
          custom_friendly_name: { type: 'string', description: 'Custom friendly name' },
          custom_message: { type: 'string', description: 'Custom message template' },
          send_digits: { type: 'string', description: 'Digits to send after call connects' },
          locale: { type: 'string', description: 'Locale for the message' },
          custom_code: { type: 'string', description: 'Custom verification code' },
          amount: { type: 'string', description: 'Amount for transaction verification' },
          payee: { type: 'string', description: 'Payee for transaction verification' }
        },
        required: ['service_sid', 'to', 'channel']
      },
      handler: async (args: any) => {
        const { service_sid, ...verificationData } = args;
        const verification = await client.getClient().verify.v2.services(service_sid)
          .verifications.create(verificationData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(verification, null, 2)
          }]
        };
      }
    },

    twilio_check_verification: {
      description: 'Check/verify a verification code',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          to: { type: 'string', description: 'Phone number or email being verified' },
          code: { type: 'string', description: 'Verification code to check' },
          amount: { type: 'string', description: 'Amount for transaction verification' },
          payee: { type: 'string', description: 'Payee for transaction verification' }
        },
        required: ['service_sid', 'to', 'code']
      },
      handler: async (args: any) => {
        const { service_sid, ...checkData } = args;
        const verificationCheck = await client.getClient().verify.v2.services(service_sid)
          .verificationChecks.create(checkData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(verificationCheck, null, 2)
          }]
        };
      }
    },

    twilio_get_verification: {
      description: 'Get verification details',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          verification_sid: { type: 'string', description: 'Verification SID' }
        },
        required: ['service_sid', 'verification_sid']
      },
      handler: async (args: any) => {
        const verification = await client.getClient().verify.v2.services(args.service_sid)
          .verifications(args.verification_sid).fetch();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(verification, null, 2)
          }]
        };
      }
    },

    twilio_update_verification: {
      description: 'Update verification status',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          verification_sid: { type: 'string', description: 'Verification SID' },
          status: { type: 'string', enum: ['canceled'], description: 'New status (only canceled supported)' }
        },
        required: ['service_sid', 'verification_sid', 'status']
      },
      handler: async (args: any) => {
        const { service_sid, verification_sid, ...updateData } = args;
        const verification = await client.getClient().verify.v2.services(service_sid)
          .verifications(verification_sid).update(updateData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(verification, null, 2)
          }]
        };
      }
    },

    twilio_create_rate_limit: {
      description: 'Create rate limit for a Verify service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          unique_name: { type: 'string', description: 'Unique name for rate limit' },
          description: { type: 'string', description: 'Description of rate limit' }
        },
        required: ['service_sid', 'unique_name']
      },
      handler: async (args: any) => {
        const { service_sid, ...rateLimitData } = args;
        const rateLimit = await client.getClient().verify.v2.services(service_sid)
          .rateLimits.create(rateLimitData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(rateLimit, null, 2)
          }]
        };
      }
    },

    twilio_list_rate_limits: {
      description: 'List rate limits for a Verify service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          limit: { type: 'number', description: 'Maximum results to return' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        const rateLimits = await client.getClient().verify.v2.services(args.service_sid)
          .rateLimits.list({ limit: args.limit });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(rateLimits, null, 2)
          }]
        };
      }
    }
  };
}

