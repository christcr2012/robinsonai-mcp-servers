import { TwilioClient } from '../client.js';

export function createNotifyTools(client: TwilioClient) {
  return {
    twilio_create_notify_service: {
      description: 'Create a Notify service for push notifications',
      inputSchema: {
        type: 'object',
        properties: {
          friendly_name: { type: 'string', description: 'Friendly name for the service' },
          apn_credential_sid: { type: 'string', description: 'Apple Push Notification credential SID' },
          gcm_credential_sid: { type: 'string', description: 'Google Cloud Messaging credential SID' },
          fcm_credential_sid: { type: 'string', description: 'Firebase Cloud Messaging credential SID' },
          messaging_service_sid: { type: 'string', description: 'Messaging Service SID for SMS fallback' },
          facebook_messenger_page_id: { type: 'string', description: 'Facebook Messenger Page ID' },
          default_apn_notification_protocol_version: { type: 'string', description: 'APN protocol version' },
          default_gcm_notification_protocol_version: { type: 'string', description: 'GCM protocol version' },
          default_fcm_notification_protocol_version: { type: 'string', description: 'FCM protocol version' }
        },
        required: ['friendly_name']
      },
      handler: async (args: any) => {
        const service = await client.getClient().notify.v1.services.create(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(service, null, 2)
          }]
        };
      }
    },

    twilio_list_notify_services: {
      description: 'List all Notify services',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of services to return' }
        }
      },
      handler: async (args: any) => {
        const services = await client.getClient().notify.v1.services.list({ limit: args.limit });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(services, null, 2)
          }]
        };
      }
    },

    twilio_get_notify_service: {
      description: 'Get details of a Notify service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        const service = await client.getClient().notify.v1.services(args.service_sid).fetch();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(service, null, 2)
          }]
        };
      }
    },

    twilio_update_notify_service: {
      description: 'Update a Notify service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          friendly_name: { type: 'string', description: 'New friendly name' },
          apn_credential_sid: { type: 'string', description: 'Apple Push Notification credential SID' },
          gcm_credential_sid: { type: 'string', description: 'Google Cloud Messaging credential SID' },
          fcm_credential_sid: { type: 'string', description: 'Firebase Cloud Messaging credential SID' },
          messaging_service_sid: { type: 'string', description: 'Messaging Service SID' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        const { service_sid, ...updateData } = args;
        const service = await client.getClient().notify.v1.services(service_sid).update(updateData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(service, null, 2)
          }]
        };
      }
    },

    twilio_delete_notify_service: {
      description: 'Delete a Notify service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID to delete' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        await client.getClient().notify.v1.services(args.service_sid).remove();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, message: 'Service deleted' }, null, 2)
          }]
        };
      }
    },

    twilio_create_notification: {
      description: 'Send a notification to one or more users',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          identity: { type: 'array', items: { type: 'string' }, description: 'User identities to notify' },
          tag: { type: 'array', items: { type: 'string' }, description: 'Tags to notify' },
          body: { type: 'string', description: 'Notification body text' },
          title: { type: 'string', description: 'Notification title' },
          priority: { type: 'string', enum: ['high', 'low'], description: 'Notification priority' },
          ttl: { type: 'number', description: 'Time to live in seconds' },
          action: { type: 'string', description: 'Action to perform when notification is tapped' },
          data: { type: 'object', description: 'Custom data payload' },
          apn: { type: 'object', description: 'APN-specific payload' },
          gcm: { type: 'object', description: 'GCM-specific payload' },
          fcm: { type: 'object', description: 'FCM-specific payload' },
          sms: { type: 'object', description: 'SMS fallback configuration' },
          facebook_messenger: { type: 'object', description: 'Facebook Messenger configuration' },
          alexa: { type: 'object', description: 'Alexa configuration' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        const { service_sid, ...notificationData } = args;
        const notification = await client.getClient().notify.v1.services(service_sid)
          .notifications.create(notificationData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(notification, null, 2)
          }]
        };
      }
    },

    twilio_create_binding: {
      description: 'Create a binding (register a device for notifications)',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          identity: { type: 'string', description: 'User identity' },
          binding_type: { type: 'string', enum: ['apn', 'gcm', 'fcm', 'sms', 'facebook-messenger', 'alexa'], description: 'Binding type' },
          address: { type: 'string', description: 'Device token or phone number' },
          tag: { type: 'array', items: { type: 'string' }, description: 'Tags for this binding' },
          notification_protocol_version: { type: 'string', description: 'Protocol version' },
          credential_sid: { type: 'string', description: 'Credential SID' }
        },
        required: ['service_sid', 'identity', 'binding_type', 'address']
      },
      handler: async (args: any) => {
        const { service_sid, ...bindingData } = args;
        const binding = await client.getClient().notify.v1.services(service_sid)
          .bindings.create(bindingData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(binding, null, 2)
          }]
        };
      }
    },

    twilio_list_bindings: {
      description: 'List bindings for a Notify service',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          identity: { type: 'string', description: 'Filter by user identity' },
          tag: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
          limit: { type: 'number', description: 'Maximum results to return' }
        },
        required: ['service_sid']
      },
      handler: async (args: any) => {
        const { service_sid, ...listParams } = args;
        const bindings = await client.getClient().notify.v1.services(service_sid)
          .bindings.list(listParams);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(bindings, null, 2)
          }]
        };
      }
    },

    twilio_get_binding: {
      description: 'Get binding details',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          binding_sid: { type: 'string', description: 'Binding SID' }
        },
        required: ['service_sid', 'binding_sid']
      },
      handler: async (args: any) => {
        const binding = await client.getClient().notify.v1.services(args.service_sid)
          .bindings(args.binding_sid).fetch();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(binding, null, 2)
          }]
        };
      }
    },

    twilio_delete_binding: {
      description: 'Delete a binding (unregister device)',
      inputSchema: {
        type: 'object',
        properties: {
          service_sid: { type: 'string', description: 'Service SID' },
          binding_sid: { type: 'string', description: 'Binding SID to delete' }
        },
        required: ['service_sid', 'binding_sid']
      },
      handler: async (args: any) => {
        await client.getClient().notify.v1.services(args.service_sid)
          .bindings(args.binding_sid).remove();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, message: 'Binding deleted' }, null, 2)
          }]
        };
      }
    },

    twilio_create_credential: {
      description: 'Create push notification credentials (APN, FCM, GCM)',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['apn', 'gcm', 'fcm'], description: 'Credential type' },
          friendly_name: { type: 'string', description: 'Friendly name' },
          certificate: { type: 'string', description: 'APN certificate (for APN)' },
          private_key: { type: 'string', description: 'APN private key (for APN)' },
          sandbox: { type: 'boolean', description: 'Use APN sandbox (for APN)' },
          api_key: { type: 'string', description: 'API key (for GCM/FCM)' },
          secret: { type: 'string', description: 'Secret (for FCM)' }
        },
        required: ['type']
      },
      handler: async (args: any) => {
        const credential = await client.getClient().notify.v1.credentials.create(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(credential, null, 2)
          }]
        };
      }
    },

    twilio_list_credentials: {
      description: 'List push notification credentials',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum results to return' }
        }
      },
      handler: async (args: any) => {
        const credentials = await client.getClient().notify.v1.credentials.list({ limit: args.limit });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(credentials, null, 2)
          }]
        };
      }
    },

    twilio_get_credential: {
      description: 'Get credential details',
      inputSchema: {
        type: 'object',
        properties: {
          credential_sid: { type: 'string', description: 'Credential SID' }
        },
        required: ['credential_sid']
      },
      handler: async (args: any) => {
        const credential = await client.getClient().notify.v1.credentials(args.credential_sid).fetch();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(credential, null, 2)
          }]
        };
      }
    },

    twilio_update_credential: {
      description: 'Update push notification credentials',
      inputSchema: {
        type: 'object',
        properties: {
          credential_sid: { type: 'string', description: 'Credential SID' },
          friendly_name: { type: 'string', description: 'New friendly name' },
          certificate: { type: 'string', description: 'New APN certificate' },
          private_key: { type: 'string', description: 'New APN private key' },
          sandbox: { type: 'boolean', description: 'Use APN sandbox' },
          api_key: { type: 'string', description: 'New API key' },
          secret: { type: 'string', description: 'New secret' }
        },
        required: ['credential_sid']
      },
      handler: async (args: any) => {
        const { credential_sid, ...updateData } = args;
        const credential = await client.getClient().notify.v1.credentials(credential_sid).update(updateData);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(credential, null, 2)
          }]
        };
      }
    },

    twilio_delete_credential: {
      description: 'Delete push notification credentials',
      inputSchema: {
        type: 'object',
        properties: {
          credential_sid: { type: 'string', description: 'Credential SID to delete' }
        },
        required: ['credential_sid']
      },
      handler: async (args: any) => {
        await client.getClient().notify.v1.credentials(args.credential_sid).remove();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, message: 'Credential deleted' }, null, 2)
          }]
        };
      }
    }
  };
}

