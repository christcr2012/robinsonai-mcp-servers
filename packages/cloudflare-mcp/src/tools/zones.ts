import { z } from 'zod';
import { CloudflareClient } from '../client.js';
import { CreateZoneSchema } from '../types.js';

export function createZoneTools(client: CloudflareClient) {
  return {
    cloudflare_create_zone: {
      description: 'Add a new zone (domain) to Cloudflare',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Domain name (e.g., example.com)' },
          account_id: { type: 'string', description: 'Account ID' },
          jump_start: { type: 'boolean', description: 'Automatically scan for DNS records' },
          type: { type: 'string', enum: ['full', 'partial'], description: 'Zone type' }
        },
        required: ['name', 'account_id']
      },
      handler: async (args: any) => {
        const validated = CreateZoneSchema.parse(args);
        const result = await client.createZone(validated);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_get_zone: {
      description: 'Get details of a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.getZone(args.zone_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_list_zones: {
      description: 'List all zones in your account',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Filter by zone name' },
          account_id: { type: 'string', description: 'Filter by account ID' },
          status: { type: 'string', enum: ['active', 'pending', 'initializing', 'moved', 'deleted', 'deactivated'] },
          per_page: { type: 'number', description: 'Results per page' },
          page: { type: 'number', description: 'Page number' }
        }
      },
      handler: async (args: any) => {
        const result = await client.listZones(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_zone: {
      description: 'Update zone settings',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          paused: { type: 'boolean', description: 'Pause zone' },
          plan: { type: 'object', description: 'Plan settings' },
          vanity_name_servers: { type: 'array', items: { type: 'string' }, description: 'Custom nameservers' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const result = await client.updateZone(zone_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_zone: {
      description: 'Delete a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID to delete' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.deleteZone(args.zone_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_purge_zone_cache: {
      description: 'Purge cache for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          purge_everything: { type: 'boolean', description: 'Purge all cached content' },
          files: { type: 'array', items: { type: 'string' }, description: 'Specific URLs to purge' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Cache tags to purge' },
          hosts: { type: 'array', items: { type: 'string' }, description: 'Hostnames to purge' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const result = await client.purgeZoneCache(zone_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_get_zone_analytics: {
      description: 'Get analytics data for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          since: { type: 'string', description: 'Start time (ISO 8601)' },
          until: { type: 'string', description: 'End time (ISO 8601)' },
          continuous: { type: 'boolean', description: 'Include continuous data' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const result = await client.getZoneAnalytics(zone_id, params);
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

