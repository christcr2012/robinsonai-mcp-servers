import { z } from 'zod';
import { CloudflareClient } from '../client.js';

export function createZoneSettingsTools(client: CloudflareClient) {
  return {
    cloudflare_get_all_zone_settings: {
      description: 'Get all zone settings',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const result = await client.getAllZoneSettings(args.zone_id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_security_level: {
      description: 'Update security level',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['off', 'essentially_off', 'low', 'medium', 'high', 'under_attack'],
            description: 'Security level'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateSecurityLevel(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_always_use_https: {
      description: 'Enable/disable always use HTTPS',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['on', 'off'],
            description: 'Always use HTTPS'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateAlwaysUseHttps(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_min_tls_version: {
      description: 'Update minimum TLS version',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['1.0', '1.1', '1.2', '1.3'],
            description: 'Minimum TLS version'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateMinTlsVersion(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_automatic_https_rewrites: {
      description: 'Enable/disable automatic HTTPS rewrites',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['on', 'off'],
            description: 'Automatic HTTPS rewrites'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateAutomaticHttpsRewrites(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_brotli: {
      description: 'Enable/disable Brotli compression',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['on', 'off'],
            description: 'Brotli compression'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateBrotli(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_minify: {
      description: 'Update minification settings',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          css: { type: 'string', enum: ['on', 'off'], description: 'Minify CSS' },
          html: { type: 'string', enum: ['on', 'off'], description: 'Minify HTML' },
          js: { type: 'string', enum: ['on', 'off'], description: 'Minify JavaScript' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const { zone_id, ...value } = args;
        const result = await client.updateMinify(zone_id, value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_rocket_loader: {
      description: 'Enable/disable Rocket Loader',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['on', 'off'],
            description: 'Rocket Loader'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateRocketLoader(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_http2: {
      description: 'Enable/disable HTTP/2',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['on', 'off'],
            description: 'HTTP/2'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateHttp2(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_http3: {
      description: 'Enable/disable HTTP/3',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['on', 'off'],
            description: 'HTTP/3'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateHttp3(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_ipv6: {
      description: 'Enable/disable IPv6',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['on', 'off'],
            description: 'IPv6'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateIpv6(args.zone_id, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    },

    cloudflare_update_websockets: {
      description: 'Enable/disable WebSockets',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          value: {
            type: 'string',
            enum: ['on', 'off'],
            description: 'WebSockets'
          }
        },
        required: ['zone_id', 'value']
      },
      handler: async (args: any) => {
        const result = await client.updateWebsockets(args.zone_id, args.value);
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

