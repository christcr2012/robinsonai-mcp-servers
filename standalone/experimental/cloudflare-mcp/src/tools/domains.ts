import { z } from 'zod';
import { CloudflareClient } from '../client.js';

export function createDomainTools(client: CloudflareClient) {
  return {
    cloudflare_list_domains: {
      description: 'List all domains registered with Cloudflare Registrar',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' }
        },
        required: ['account_id']
      },
      handler: async (args: any) => {
        const result = await client.listDomains(args.account_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_get_domain: {
      description: 'Get details of a registered domain',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          domain_name: { type: 'string', description: 'Domain name (e.g., example.com)' }
        },
        required: ['account_id', 'domain_name']
      },
      handler: async (args: any) => {
        const result = await client.getDomain(args.account_id, args.domain_name);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_domain: {
      description: 'Update domain settings (auto-renew, privacy, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          account_id: { type: 'string', description: 'Account ID' },
          domain_name: { type: 'string', description: 'Domain name' },
          auto_renew: { type: 'boolean', description: 'Enable/disable auto-renewal' },
          privacy: { type: 'boolean', description: 'Enable/disable WHOIS privacy' },
          locked: { type: 'boolean', description: 'Lock/unlock domain transfers' }
        },
        required: ['account_id', 'domain_name']
      },
      handler: async (args: any) => {
        const { account_id, domain_name, ...params } = args;
        const result = await client.updateDomain(account_id, domain_name, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_check_domain_availability: {
      description: 'Check if a domain is available for registration',
      inputSchema: {
        type: 'object',
        properties: {
          domain_name: { type: 'string', description: 'Domain name to check (e.g., example.com)' }
        },
        required: ['domain_name']
      },
      handler: async (args: any) => {
        // Note: Cloudflare API doesn't have a direct availability check endpoint
        // This would need to be implemented via the registrar API or return a message
        return {
          content: [{
            type: 'text',
            text: 'Domain availability check requires Cloudflare Registrar API access. Please check availability through the Cloudflare dashboard or contact support.'
          }]
        };
      }
    }
  };
}

