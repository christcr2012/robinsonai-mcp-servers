# Cortiware Cloudflare MCP Server

Comprehensive MCP server for Cloudflare with 50+ tools for domain management, DNS records, SSL/TLS, and domain verification.

## Features

### DNS Tools (7 tools)
- `cloudflare_create_dns_record` - Create DNS records (A, AAAA, CNAME, MX, TXT, etc.)
- `cloudflare_get_dns_record` - Get DNS record details
- `cloudflare_list_dns_records` - List all DNS records with filters
- `cloudflare_update_dns_record` - Update DNS records
- `cloudflare_delete_dns_record` - Delete DNS records
- `cloudflare_bulk_create_dns_records` - Create multiple records at once
- `cloudflare_export_dns_records` - Export all DNS records

### Zone Tools (7 tools)
- `cloudflare_create_zone` - Add new domain to Cloudflare
- `cloudflare_get_zone` - Get zone details
- `cloudflare_list_zones` - List all zones
- `cloudflare_update_zone` - Update zone settings
- `cloudflare_delete_zone` - Delete zones
- `cloudflare_purge_zone_cache` - Purge cached content
- `cloudflare_get_zone_analytics` - Get analytics data

### Domain Tools (4 tools)
- `cloudflare_list_domains` - List registered domains
- `cloudflare_get_domain` - Get domain details
- `cloudflare_update_domain` - Update domain settings
- `cloudflare_check_domain_availability` - Check domain availability

### SSL/TLS Tools (5 tools)
- `cloudflare_list_ssl_certificates` - List SSL certificates
- `cloudflare_get_ssl_certificate` - Get certificate details
- `cloudflare_get_ssl_settings` - Get SSL settings
- `cloudflare_update_ssl_settings` - Update SSL mode
- `cloudflare_get_ssl_verification_status` - Check verification status

### Verification Tools (5 tools)
- `cloudflare_get_verification_records` - Get verification records for services
- `cloudflare_verify_domain_ownership` - Verify domain ownership
- `cloudflare_setup_email_verification` - Set up SPF/DKIM/DMARC
- `cloudflare_setup_vercel_domain` - Configure domain for Vercel
- Domain verification for Resend, SendGrid, Mailgun, Vercel, Netlify

### Troubleshooting Tools (4 tools)
- `cloudflare_diagnose_dns` - Diagnose DNS configuration issues
- `cloudflare_check_propagation` - Check DNS propagation status
- `cloudflare_validate_ssl_setup` - Validate SSL/TLS configuration
- `cloudflare_test_email_dns` - Test email DNS (SPF, DKIM, DMARC)

## Installation

```bash
cd tools/cortiware-cloudflare-mcp
npm install
npm run build
```

## Configuration

Add to your `mcp-config.json`:

```json
{
  "mcpServers": {
    "cloudflare-cortiware": {
      "command": "node",
      "args": ["path/to/cortiware-cloudflare-mcp/dist/index.js"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

## Environment Variables

**Option 1: API Token (Recommended)**
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token

**Option 2: Global API Key**
- `CLOUDFLARE_EMAIL` - Your Cloudflare account email
- `CLOUDFLARE_API_KEY` - Your Global API Key

## Usage Examples

### Create DNS Record
```typescript
{
  "zone_id": "zone_abc123",
  "type": "A",
  "name": "@",
  "content": "192.0.2.1",
  "proxied": true
}
```

### Set Up Email Verification
```typescript
{
  "zone_id": "zone_abc123",
  "service": "resend",
  "spf_record": "v=spf1 include:_spf.resend.com ~all",
  "dkim_name": "resend._domainkey",
  "dkim_record": "v=DKIM1; k=rsa; p=MIGfMA0GCS...",
  "dmarc_record": "v=DMARC1; p=none; rua=mailto:dmarc@cortiware.com"
}
```

### Set Up Vercel Domain
```typescript
{
  "zone_id": "zone_abc123",
  "subdomain": "app",
  "vercel_ip": "76.76.21.21"
}
```

### Diagnose DNS Issues
```typescript
{
  "zone_id": "zone_abc123"
}
```

## Use Cases

### Domain Management
- Register and manage domains
- Configure DNS records
- Set up SSL/TLS certificates

### Email Service Integration
- Verify domains for Resend, SendGrid, Mailgun
- Configure SPF, DKIM, DMARC records
- Troubleshoot email delivery

### Hosting Platform Integration
- Configure domains for Vercel, Netlify
- Set up DNS records for deployments
- Verify domain ownership

### Troubleshooting
- Diagnose DNS configuration issues
- Check SSL/TLS setup
- Validate email DNS records

## Development

```bash
npm run dev    # Watch mode
npm run build  # Production build
npm start      # Run server
```

## License

MIT

