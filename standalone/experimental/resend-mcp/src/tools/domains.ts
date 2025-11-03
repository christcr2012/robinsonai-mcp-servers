import { z } from 'zod';
import { ResendClient } from '../client.js';
import { AddDomainSchema, UpdateDomainSchema } from '../types.js';

export function createDomainTools(client: ResendClient) {
  return {
    resend_add_domain: {
      description: 'Add a new domain to Resend',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Domain name (e.g., example.com)' },
          region: { 
            type: 'string', 
            enum: ['us-east-1', 'eu-west-1', 'sa-east-1'],
            description: 'AWS region for the domain' 
          }
        },
        required: ['name']
      },
      handler: async (args: any) => {
        const validated = AddDomainSchema.parse(args);
        const result = await client.addDomain(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_get_domain: {
      description: 'Get details of a specific domain',
      inputSchema: {
        type: 'object',
        properties: {
          domain_id: { type: 'string', description: 'Domain ID to retrieve' }
        },
        required: ['domain_id']
      },
      handler: async (args: any) => {
        const result = await client.getDomain(args.domain_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_list_domains: {
      description: 'List all domains in your Resend account',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const result = await client.listDomains();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_update_domain: {
      description: 'Update domain settings (tracking options)',
      inputSchema: {
        type: 'object',
        properties: {
          domain_id: { type: 'string', description: 'Domain ID to update' },
          open_tracking: { type: 'boolean', description: 'Enable/disable open tracking' },
          click_tracking: { type: 'boolean', description: 'Enable/disable click tracking' }
        },
        required: ['domain_id']
      },
      handler: async (args: any) => {
        const validated = UpdateDomainSchema.parse(args);
        const { domain_id, ...params } = validated;
        const result = await client.updateDomain(domain_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_delete_domain: {
      description: 'Delete a domain from Resend',
      inputSchema: {
        type: 'object',
        properties: {
          domain_id: { type: 'string', description: 'Domain ID to delete' }
        },
        required: ['domain_id']
      },
      handler: async (args: any) => {
        const result = await client.deleteDomain(args.domain_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_verify_domain: {
      description: 'Verify domain DNS records',
      inputSchema: {
        type: 'object',
        properties: {
          domain_id: { type: 'string', description: 'Domain ID to verify' }
        },
        required: ['domain_id']
      },
      handler: async (args: any) => {
        const result = await client.verifyDomain(args.domain_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    resend_get_domain_dns_records: {
      description: 'Get DNS records needed for domain verification',
      inputSchema: {
        type: 'object',
        properties: {
          domain_id: { type: 'string', description: 'Domain ID' }
        },
        required: ['domain_id']
      },
      handler: async (args: any) => {
        const domain = await client.getDomain(args.domain_id);
        const domainData = (domain as any).data || domain;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              domain_id: args.domain_id,
              dns_records: domainData.records || [],
              status: domainData.status,
              region: domainData.region
            }, null, 2)
          }]
        };
      }
    }
  };
}

