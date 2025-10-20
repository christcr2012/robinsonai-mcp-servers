import { z } from 'zod';
import { CloudflareClient } from '../client.js';

export function createCacheTools(client: CloudflareClient) {
  return {
    cloudflare_purge_cache_everything: {
      description: 'Purge all cached content for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.purgeZoneCache(args.zone_id, { purge_everything: true });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_purge_cache_by_urls: {
      description: 'Purge specific URLs from cache',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'URLs to purge'
          }
        },
        required: ['zone_id', 'files']
      },
      handler: async (args: any) => {
        const { zone_id, files } = args;
        const result = await client.purgeZoneCache(zone_id, { files });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_purge_cache_by_tags: {
      description: 'Purge cache by cache tags',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Cache tags to purge'
          }
        },
        required: ['zone_id', 'tags']
      },
      handler: async (args: any) => {
        const { zone_id, tags } = args;
        const result = await client.purgeZoneCache(zone_id, { tags });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_purge_cache_by_hosts: {
      description: 'Purge cache by hostnames',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          hosts: {
            type: 'array',
            items: { type: 'string' },
            description: 'Hostnames to purge'
          }
        },
        required: ['zone_id', 'hosts']
      },
      handler: async (args: any) => {
        const { zone_id, hosts } = args;
        const result = await client.purgeZoneCache(zone_id, { hosts });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_get_cache_settings: {
      description: 'Get cache settings for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.getCacheSettings(args.zone_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_cache_level: {
      description: 'Update cache level setting',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['aggressive', 'basic', 'simplified'],
            description: 'Cache level'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateCacheLevel(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_browser_cache_ttl: {
      description: 'Update browser cache TTL',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'number',
            description: 'TTL in seconds (0, 30, 60, 300, 1200, 1800, 3600, 7200, 10800, 14400, 18000, 28800, 43200, 57600, 72000, 86400, 172800, 259200, 345600, 432000, 691200, 1382400, 2073600, 2678400, 5356800, 16070400, 31536000)'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateBrowserCacheTtl(args.zone_id, args.value);
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

