/**
 * Cloudflare Tool Definitions Part 1
 * Edge computing and CDN platform
 * 
 * Categories:
 * - Zones (DNS & Domain Management): 30 tools
 * - Workers (Serverless Functions): 25 tools
 * - KV (Key-Value Storage): 15 tools
 * - R2 (Object Storage): 20 tools
 * - Pages (Static Sites): 20 tools
 * - D1 (SQL Database): 15 tools
 * - Queues (Message Queues): 10 tools
 * - Durable Objects: 10 tools
 * - Stream (Video): 15 tools
 * 
 * Total: 160 tools
 */

import { CLOUDFLARE_TOOLS_2 } from './tools-2.js';
import { CLOUDFLARE_TOOLS_3 } from './tools-3.js';
import { CLOUDFLARE_TOOLS_4 } from './tools-4.js';
import { CLOUDFLARE_TOOLS_5 } from './tools-5.js';

const CLOUDFLARE_TOOLS_1 = [
  // ============================================================
  // ZONES (DNS & Domain Management) - 30 tools
  // ============================================================
  {
    name: 'cloudflare_list_zones',
    description: 'List all zones (domains) in the account',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Filter by zone name' },
        status: { type: 'string', description: 'Filter by status (active, pending, etc.)' },
        page: { type: 'number', description: 'Page number for pagination' },
        perPage: { type: 'number', description: 'Results per page (default: 20)' },
      },
    },
  },
  {
    name: 'cloudflare_get_zone',
    description: 'Get details of a specific zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_create_zone',
    description: 'Create a new zone (add a domain)',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Domain name' },
        account: { type: 'object', description: 'Account details' },
        jumpStart: { type: 'boolean', description: 'Automatically attempt to fetch DNS records' },
        type: { type: 'string', description: 'Zone type (full, partial)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'cloudflare_delete_zone',
    description: 'Delete a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_purge_cache',
    description: 'Purge cached content for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        purgeEverything: { type: 'boolean', description: 'Purge all cached content' },
        files: { type: 'array', items: { type: 'string' }, description: 'Specific files to purge' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Cache tags to purge' },
        hosts: { type: 'array', items: { type: 'string' }, description: 'Hosts to purge' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_list_dns_records',
    description: 'List DNS records for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        type: { type: 'string', description: 'Record type (A, AAAA, CNAME, etc.)' },
        name: { type: 'string', description: 'Record name' },
        content: { type: 'string', description: 'Record content' },
        page: { type: 'number', description: 'Page number' },
        perPage: { type: 'number', description: 'Results per page' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_get_dns_record',
    description: 'Get a specific DNS record',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        recordId: { type: 'string', description: 'DNS record ID' },
      },
      required: ['zoneId', 'recordId'],
    },
  },
  {
    name: 'cloudflare_create_dns_record',
    description: 'Create a DNS record',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        type: { type: 'string', description: 'Record type (A, AAAA, CNAME, MX, TXT, etc.)' },
        name: { type: 'string', description: 'Record name' },
        content: { type: 'string', description: 'Record content' },
        ttl: { type: 'number', description: 'Time to live (1 = automatic)' },
        priority: { type: 'number', description: 'Priority (for MX records)' },
        proxied: { type: 'boolean', description: 'Whether to proxy through Cloudflare' },
      },
      required: ['zoneId', 'type', 'name', 'content'],
    },
  },
  {
    name: 'cloudflare_update_dns_record',
    description: 'Update a DNS record',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        recordId: { type: 'string', description: 'DNS record ID' },
        type: { type: 'string', description: 'Record type' },
        name: { type: 'string', description: 'Record name' },
        content: { type: 'string', description: 'Record content' },
        ttl: { type: 'number', description: 'Time to live' },
        proxied: { type: 'boolean', description: 'Whether to proxy through Cloudflare' },
      },
      required: ['zoneId', 'recordId'],
    },
  },
  {
    name: 'cloudflare_delete_dns_record',
    description: 'Delete a DNS record',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        recordId: { type: 'string', description: 'DNS record ID' },
      },
      required: ['zoneId', 'recordId'],
    },
  },
  {
    name: 'cloudflare_get_zone_settings',
    description: 'Get all settings for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_update_zone_setting',
    description: 'Update a specific zone setting',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        setting: { type: 'string', description: 'Setting name (ssl, minify, etc.)' },
        value: { type: 'any', description: 'Setting value' },
      },
      required: ['zoneId', 'setting', 'value'],
    },
  },
  {
    name: 'cloudflare_get_ssl_setting',
    description: 'Get SSL/TLS setting for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_update_ssl_setting',
    description: 'Update SSL/TLS setting',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        value: { type: 'string', description: 'SSL mode (off, flexible, full, strict)' },
      },
      required: ['zoneId', 'value'],
    },
  },
  {
    name: 'cloudflare_list_firewall_rules',
    description: 'List firewall rules for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        page: { type: 'number', description: 'Page number' },
        perPage: { type: 'number', description: 'Results per page' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_create_firewall_rule',
    description: 'Create a firewall rule',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        filter: { type: 'object', description: 'Filter expression' },
        action: { type: 'string', description: 'Action (block, challenge, allow, etc.)' },
        description: { type: 'string', description: 'Rule description' },
        priority: { type: 'number', description: 'Rule priority' },
      },
      required: ['zoneId', 'filter', 'action'],
    },
  },
  {
    name: 'cloudflare_update_firewall_rule',
    description: 'Update a firewall rule',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        ruleId: { type: 'string', description: 'Rule ID' },
        filter: { type: 'object', description: 'Filter expression' },
        action: { type: 'string', description: 'Action' },
        description: { type: 'string', description: 'Rule description' },
      },
      required: ['zoneId', 'ruleId'],
    },
  },
  {
    name: 'cloudflare_delete_firewall_rule',
    description: 'Delete a firewall rule',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        ruleId: { type: 'string', description: 'Rule ID' },
      },
      required: ['zoneId', 'ruleId'],
    },
  },
  {
    name: 'cloudflare_list_page_rules',
    description: 'List page rules for a zone',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
      },
      required: ['zoneId'],
    },
  },
  {
    name: 'cloudflare_create_page_rule',
    description: 'Create a page rule',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        targets: { type: 'array', description: 'URL patterns to match' },
        actions: { type: 'array', description: 'Actions to apply' },
        priority: { type: 'number', description: 'Rule priority' },
        status: { type: 'string', description: 'Rule status (active, disabled)' },
      },
      required: ['zoneId', 'targets', 'actions'],
    },
  },
  {
    name: 'cloudflare_update_page_rule',
    description: 'Update a page rule',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        ruleId: { type: 'string', description: 'Rule ID' },
        targets: { type: 'array', description: 'URL patterns' },
        actions: { type: 'array', description: 'Actions' },
        status: { type: 'string', description: 'Rule status' },
      },
      required: ['zoneId', 'ruleId'],
    },
  },
  {
    name: 'cloudflare_delete_page_rule',
    description: 'Delete a page rule',
    inputSchema: {
      type: 'object',
      properties: {
        zoneId: { type: 'string', description: 'Zone ID' },
        ruleId: { type: 'string', description: 'Rule ID' },
      },
      required: ['zoneId', 'ruleId'],
    },
  },
];

// Combine all Cloudflare tools (22 + 41 + 18 + 43 + 36 = 160 total)
export const CLOUDFLARE_TOOLS = [
  ...CLOUDFLARE_TOOLS_1,
  ...CLOUDFLARE_TOOLS_2,
  ...CLOUDFLARE_TOOLS_3,
  ...CLOUDFLARE_TOOLS_4,
  ...CLOUDFLARE_TOOLS_5,
];

