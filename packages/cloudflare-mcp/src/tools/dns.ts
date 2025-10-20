import { z } from 'zod';
import { CloudflareClient } from '../client.js';
import { CreateDnsRecordSchema, UpdateDnsRecordSchema } from '../types.js';

export function createDnsTools(client: CloudflareClient) {
  return {
    cloudflare_create_dns_record: {
      description: 'Create a new DNS record',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          type: {
            type: 'string',
            enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR'],
            description: 'DNS record type'
          },
          name: { type: 'string', description: 'DNS record name (e.g., @ for root, www for subdomain)' },
          content: { type: 'string', description: 'DNS record content (IP address, domain, etc.)' },
          ttl: { type: 'number', description: 'Time to live (1 = automatic)' },
          priority: { type: 'number', description: 'Priority (for MX records)' },
          proxied: { type: 'boolean', description: 'Whether to proxy through Cloudflare (orange cloud)' }
        },
        required: ['zone_id', 'type', 'name', 'content']
      },
      handler: async (args: any) => {
        const validated = CreateDnsRecordSchema.parse(args);
        const { zone_id, ...params } = validated;
        const result = await client.createDnsRecord(zone_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_get_dns_record: {
      description: 'Get details of a DNS record',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          record_id: { type: 'string', description: 'DNS record ID' }
        },
        required: ['zone_id', 'record_id']
      },
      handler: async (args: any) => {
        const result = await client.getDnsRecord(args.zone_id, args.record_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_list_dns_records: {
      description: 'List all DNS records for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          type: { type: 'string', description: 'Filter by record type' },
          name: { type: 'string', description: 'Filter by record name' },
          content: { type: 'string', description: 'Filter by record content' },
          per_page: { type: 'number', description: 'Results per page' },
          page: { type: 'number', description: 'Page number' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const result = await client.listDnsRecords(zone_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_dns_record: {
      description: 'Update a DNS record',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          record_id: { type: 'string', description: 'DNS record ID' },
          type: { type: 'string', enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR'] },
          name: { type: 'string', description: 'DNS record name' },
          content: { type: 'string', description: 'DNS record content' },
          ttl: { type: 'number', description: 'Time to live' },
          priority: { type: 'number', description: 'Priority (for MX records)' },
          proxied: { type: 'boolean', description: 'Whether to proxy through Cloudflare' }
        },
        required: ['zone_id', 'record_id']
      },
      handler: async (args: any) => {
        const validated = UpdateDnsRecordSchema.parse(args);
        const { zone_id, record_id, ...params } = validated;
        const result = await client.updateDnsRecord(zone_id, record_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_dns_record: {
      description: 'Delete a DNS record',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          record_id: { type: 'string', description: 'DNS record ID to delete' }
        },
        required: ['zone_id', 'record_id']
      },
      handler: async (args: any) => {
        const result = await client.deleteDnsRecord(args.zone_id, args.record_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_bulk_create_dns_records: {
      description: 'Create multiple DNS records at once',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          records: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                name: { type: 'string' },
                content: { type: 'string' },
                ttl: { type: 'number' },
                proxied: { type: 'boolean' }
              },
              required: ['type', 'name', 'content']
            },
            description: 'Array of DNS records to create'
          }
        },
        required: ['zone_id', 'records']
      },
      handler: async (args: any) => {
        const results = [];
        for (const record of args.records) {
          const result = await client.createDnsRecord(args.zone_id, record);
          results.push(result);
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }]
        };
      }
    },

    cloudflare_export_dns_records: {
      description: 'Export all DNS records for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.listDnsRecords(args.zone_id, { per_page: 1000 });
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

