import { z } from 'zod';
import { CloudflareClient } from '../client.js';

export function createVerificationTools(client: CloudflareClient) {
  return {
    cloudflare_get_verification_records: {
      description: 'Get DNS verification records needed for email services (Resend, SendGrid, etc.) or hosting platforms (Vercel, Netlify, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          service: {
            type: 'string',
            enum: ['resend', 'sendgrid', 'mailgun', 'vercel', 'netlify', 'custom'],
            description: 'Service to get verification records for'
          }
        },
        required: ['zone_id', 'service']
      },
      handler: async (args: any) => {
        const records = await client.listDnsRecords(args.zone_id);
        
        // Filter for verification records based on service
        const verificationRecords = records.result?.filter((record: any) => {
          const name = record.name.toLowerCase();
          const content = record.content.toLowerCase();
          
          switch (args.service) {
            case 'resend':
              return record.type === 'TXT' && (
                name.includes('resend') || 
                content.includes('resend') ||
                name.includes('_dmarc') ||
                name.includes('_domainkey')
              );
            case 'sendgrid':
              return record.type === 'TXT' && (
                name.includes('sendgrid') ||
                content.includes('sendgrid')
              );
            case 'vercel':
              return record.type === 'TXT' && (
                name.includes('_vercel') ||
                content.includes('vercel')
              );
            default:
              return record.type === 'TXT';
          }
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zone_id: args.zone_id,
              service: args.service,
              verification_records: verificationRecords,
              all_txt_records: records.result?.filter((r: any) => r.type === 'TXT')
            }, null, 2)
          }]
        };
      }
    },

    cloudflare_verify_domain_ownership: {
      description: 'Verify domain ownership by checking for specific TXT record',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          verification_token: { type: 'string', description: 'Verification token to check for' }
        },
        required: ['zone_id', 'verification_token']
      },
      handler: async (args: any) => {
        const records = await client.listDnsRecords(args.zone_id, { type: 'TXT' });
        
        const verified = records.result?.some((record: any) => 
          record.content.includes(args.verification_token)
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zone_id: args.zone_id,
              verified,
              message: verified 
                ? 'Domain ownership verified successfully' 
                : 'Verification token not found in DNS records'
            }, null, 2)
          }]
        };
      }
    },

    cloudflare_setup_email_verification: {
      description: 'Set up DNS records for email service verification (SPF, DKIM, DMARC)',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          service: { type: 'string', enum: ['resend', 'sendgrid', 'mailgun', 'ses'], description: 'Email service' },
          spf_record: { type: 'string', description: 'SPF record content' },
          dkim_record: { type: 'string', description: 'DKIM record content' },
          dkim_name: { type: 'string', description: 'DKIM record name (e.g., default._domainkey)' },
          dmarc_record: { type: 'string', description: 'DMARC record content' }
        },
        required: ['zone_id', 'service']
      },
      handler: async (args: any) => {
        const results = [];

        // Create SPF record if provided
        if (args.spf_record) {
          const spf = await client.createDnsRecord(args.zone_id, {
            type: 'TXT',
            name: '@',
            content: args.spf_record,
            ttl: 1
          });
          results.push({ type: 'SPF', result: spf });
        }

        // Create DKIM record if provided
        if (args.dkim_record && args.dkim_name) {
          const dkim = await client.createDnsRecord(args.zone_id, {
            type: 'TXT',
            name: args.dkim_name,
            content: args.dkim_record,
            ttl: 1
          });
          results.push({ type: 'DKIM', result: dkim });
        }

        // Create DMARC record if provided
        if (args.dmarc_record) {
          const dmarc = await client.createDnsRecord(args.zone_id, {
            type: 'TXT',
            name: '_dmarc',
            content: args.dmarc_record,
            ttl: 1
          });
          results.push({ type: 'DMARC', result: dmarc });
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zone_id: args.zone_id,
              service: args.service,
              records_created: results
            }, null, 2)
          }]
        };
      }
    },

    cloudflare_setup_vercel_domain: {
      description: 'Set up DNS records for Vercel deployment',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' },
          subdomain: { type: 'string', description: 'Subdomain (e.g., www, app, or @ for root)' },
          vercel_ip: { type: 'string', description: 'Vercel IP address (default: 76.76.21.21)', default: '76.76.21.21' }
        },
        required: ['zone_id', 'subdomain']
      },
      handler: async (args: any) => {
        const ip = args.vercel_ip || '76.76.21.21';
        
        const aRecord = await client.createDnsRecord(args.zone_id, {
          type: 'A',
          name: args.subdomain,
          content: ip,
          ttl: 1,
          proxied: false
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zone_id: args.zone_id,
              subdomain: args.subdomain,
              record_created: aRecord,
              message: 'DNS record created. Add this domain in your Vercel project settings to complete setup.'
            }, null, 2)
          }]
        };
      }
    }
  };
}

