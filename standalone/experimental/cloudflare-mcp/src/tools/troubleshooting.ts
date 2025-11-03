import { z } from 'zod';
import { CloudflareClient } from '../client.js';

export function createTroubleshootingTools(client: CloudflareClient) {
  return {
    cloudflare_diagnose_dns: {
      description: 'Diagnose DNS configuration issues for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const zone = await client.getZone(args.zone_id);
        const zoneData = (zone as any).result || zone;
        const records = await client.listDnsRecords(args.zone_id);

        const issues = [];

        // Check for common issues
        if (zoneData.status !== 'active') {
          issues.push({
            severity: 'error',
            issue: 'Zone is not active',
            status: zoneData.status,
            solution: 'Update nameservers at your registrar to point to Cloudflare'
          });
        }

        // Check for missing A/AAAA records
        const hasRootRecord = records.result?.some((r: any) =>
          (r.type === 'A' || r.type === 'AAAA') && r.name === zoneData.name
        );
        if (!hasRootRecord) {
          issues.push({
            severity: 'warning',
            issue: 'No A or AAAA record for root domain',
            solution: 'Add an A or AAAA record for @ (root domain)'
          });
        }

        // Check for www record
        const hasWwwRecord = records.result?.some((r: any) =>
          r.name === `www.${zoneData.name}`
        );
        if (!hasWwwRecord) {
          issues.push({
            severity: 'info',
            issue: 'No www subdomain configured',
            solution: 'Consider adding a CNAME or A record for www'
          });
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zone_id: args.zone_id,
              zone_name: zoneData.name,
              zone_status: zoneData.status,
              nameservers: zoneData.name_servers,
              total_records: records.result?.length || 0,
              issues,
              health: issues.length === 0 ? 'healthy' : 'needs attention'
            }, null, 2)
          }]
        };
      }
    },

    cloudflare_check_propagation: {
      description: 'Check DNS propagation status for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const zone = await client.getZone(args.zone_id);
        const zoneData = (zone as any).result || zone;

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zone_id: args.zone_id,
              zone_name: zoneData.name,
              status: zoneData.status,
              nameservers: zoneData.name_servers,
              message: 'DNS propagation can take 24-48 hours. Check status at https://www.whatsmydns.net',
              verification_url: `https://www.whatsmydns.net/#NS/${zoneData.name}`
            }, null, 2)
          }]
        };
      }
    },

    cloudflare_validate_ssl_setup: {
      description: 'Validate SSL/TLS configuration for a zone',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const zone = await client.getZone(args.zone_id);
        const zoneData = (zone as any).result || zone;
        const sslSettings = await client.getSslSettings(args.zone_id);
        const sslData = (sslSettings as any).result || sslSettings;
        const certificates = await client.listSslCertificates(args.zone_id);

        const issues = [];

        if (sslData.value === 'off') {
          issues.push({
            severity: 'error',
            issue: 'SSL is disabled',
            solution: 'Enable SSL in Cloudflare dashboard (recommended: Full or Full (Strict))'
          });
        }

        if (sslData.value === 'flexible') {
          issues.push({
            severity: 'warning',
            issue: 'SSL mode is Flexible (not fully secure)',
            solution: 'Upgrade to Full or Full (Strict) mode and install SSL certificate on origin server'
          });
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zone_id: args.zone_id,
              zone_name: zoneData.name,
              ssl_mode: sslData.value,
              certificates: certificates.result?.length || 0,
              issues,
              recommendation: 'Use Full (Strict) mode with valid SSL certificate on origin server'
            }, null, 2)
          }]
        };
      }
    },

    cloudflare_test_email_dns: {
      description: 'Test email DNS configuration (SPF, DKIM, DMARC)',
      inputSchema: {
        type: 'object',
        properties: {
          zone_id: { type: 'string', description: 'Zone ID' }
        },
        required: ['zone_id']
      },
      handler: async (args: any) => {
        const records = await client.listDnsRecords(args.zone_id, { type: 'TXT' });
        
        const spfRecord = records.result?.find((r: any) => 
          r.name === '@' && r.content.includes('v=spf1')
        );
        
        const dkimRecords = records.result?.filter((r: any) => 
          r.name.includes('_domainkey')
        );
        
        const dmarcRecord = records.result?.find((r: any) => 
          r.name.includes('_dmarc')
        );

        const mxRecords = await client.listDnsRecords(args.zone_id, { type: 'MX' });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              zone_id: args.zone_id,
              email_dns_status: {
                spf: spfRecord ? 'configured' : 'missing',
                spf_record: spfRecord,
                dkim: dkimRecords && dkimRecords.length > 0 ? 'configured' : 'missing',
                dkim_records: dkimRecords,
                dmarc: dmarcRecord ? 'configured' : 'missing',
                dmarc_record: dmarcRecord,
                mx: mxRecords.result && mxRecords.result.length > 0 ? 'configured' : 'missing',
                mx_records: mxRecords.result
              },
              recommendations: [
                !spfRecord && 'Add SPF record to prevent email spoofing',
                (!dkimRecords || dkimRecords.length === 0) && 'Add DKIM records for email authentication',
                !dmarcRecord && 'Add DMARC record for email policy enforcement'
              ].filter(Boolean)
            }, null, 2)
          }]
        };
      }
    }
  };
}

