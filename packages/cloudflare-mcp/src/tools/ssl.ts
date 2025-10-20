import { z } from 'zod';
import { CloudflareClient } from '../client.js';

export function createSslTools(client: CloudflareClient) {
  return {
    cloudflare_list_ssl_certificates: {
      description: 'List SSL/TLS certificates for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.listSslCertificates(args.zone_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_get_ssl_certificate: {
      description: 'Get details of an SSL/TLS certificate',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          certificate_id: { type: 'string', description: 'Certificate ID' }
        },
        required: ['zone_id', 'certificate_id']
      },
      handler: async (args: any) => {
        const result = await client.getSslCertificate(args.zone_id, args.certificate_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_get_ssl_settings: {
      description: 'Get SSL/TLS settings for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.getSslSettings(args.zone_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_ssl_settings: {
      description: 'Update SSL/TLS settings for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['off', 'flexible', 'full', 'strict'],
            description: 'SSL mode: off, flexible, full, or strict'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const result = await client.updateSslSettings(zone_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_get_ssl_verification_status: {
      description: 'Check SSL certificate verification status',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const certs = await client.listSslCertificates(args.zone_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zone_id: args.zone_id,
              certificates: certs,
              message: 'Check the status field of each certificate for verification status'
            }, null, 2)
          }]
        };
      }
    }
  };
}

