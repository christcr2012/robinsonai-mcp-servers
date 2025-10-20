import { z } from 'zod';
import { CloudflareClient } from '../client.js';

export function createFirewallTools(client: CloudflareClient) {
  return {
    cloudflare_list_firewall_rules: {
      description: 'List firewall rules for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.listFirewallRules(args.zone_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_create_firewall_rule: {
      description: 'Create a firewall rule',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          filter: { type: 'object', description: 'Filter expression' },
          action: {
            type: 'string',
            enum: ['block', 'challenge', 'js_challenge', 'managed_challenge', 'allow', 'log', 'bypass'],
            description: 'Action to take'
          },
          description: { type: 'string', description: 'Rule description' },
          priority: { type: 'number', description: 'Rule priority' }
        },
        required: ['zone_id', 'filter', 'action']
      },
      handler: async (args: any) => {
        const { zone_id, ...params } = args;
        const result = await client.createFirewallRule(zone_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_firewall_rule: {
      description: 'Update a firewall rule',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          rule_id: { type: 'string', description: 'Rule ID' },
          filter: { type: 'object', description: 'Filter expression' },
          action: { type: 'string', description: 'Action to take' },
          description: { type: 'string', description: 'Rule description' },
          paused: { type: 'boolean', description: 'Pause rule' }
        },
        required: ['zone_id', 'rule_id']
      },
      handler: async (args: any) => {
        const { zone_id, rule_id, ...params } = args;
        const result = await client.updateFirewallRule(zone_id, rule_id, params);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_delete_firewall_rule: {
      description: 'Delete a firewall rule',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          rule_id: { type: 'string', description: 'Rule ID' }
        },
        required: ['zone_id', 'rule_id']
      },
      handler: async (args: any) => {
        await client.deleteFirewallRule(args.zone_id, args.rule_id);
        return {
          content: [{
            type: 'text',
            text: 'Firewall rule deleted successfully'
          }]
        };
      }
    },

    cloudflare_list_waf_packages: {
      description: 'List WAF packages for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.listWafPackages(args.zone_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_list_waf_rules: {
      description: 'List WAF rules in a package',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          package_id: { type: 'string', description: 'WAF package ID' }
        },
        required: ['zone_id', 'package_id']
      },
      handler: async (args: any) => {
        const result = await client.listWafRules(args.zone_id, args.package_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_waf_rule: {
      description: 'Update WAF rule mode',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          package_id: { type: 'string', description: 'WAF package ID' },
          rule_id: { type: 'string', description: 'WAF rule ID' },
          mode: {
            type: 'string',
            enum: ['default', 'disable', 'simulate', 'block', 'challenge'],
            description: 'Rule mode'
          }
        },
        required: ['zone_id', 'package_id', 'rule_id', 'mode']
      },
      handler: async (args: any) => {
        const { zone_id, package_id, rule_id, mode } = args;
        const result = await client.updateWafRule(zone_id, package_id, rule_id, mode);
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

