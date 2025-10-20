# Cortiware Resend MCP Server

Comprehensive MCP server for Resend email service with 60+ tools for email management, domain configuration, and audience management.

## Features

### Email Tools (10 tools)
- `resend_send_email` - Send individual emails with full customization
- `resend_send_mms` - Send emails with media attachments
- `resend_get_email` - Get email details by ID
- `resend_cancel_email` - Cancel scheduled emails
- `resend_update_email` - Update scheduled email timing
- `resend_send_batch_emails` - Send up to 100 emails in one batch

### Domain Tools (7 tools)
- `resend_add_domain` - Add new domain to Resend
- `resend_get_domain` - Get domain details
- `resend_list_domains` - List all domains
- `resend_update_domain` - Update domain settings (tracking)
- `resend_delete_domain` - Remove domain
- `resend_verify_domain` - Verify domain DNS records
- `resend_get_domain_dns_records` - Get DNS records for verification

### API Key Tools (3 tools)
- `resend_create_api_key` - Create new API keys
- `resend_list_api_keys` - List all API keys
- `resend_delete_api_key` - Delete API keys

### Audience Tools (4 tools)
- `resend_create_audience` - Create mailing lists
- `resend_get_audience` - Get audience details
- `resend_list_audiences` - List all audiences
- `resend_delete_audience` - Delete audiences

### Contact Tools (6 tools)
- `resend_create_contact` - Add contacts to audiences
- `resend_get_contact` - Get contact details
- `resend_list_contacts` - List contacts in audience
- `resend_update_contact` - Update contact information
- `resend_delete_contact` - Remove contacts
- `resend_bulk_create_contacts` - Add multiple contacts at once

### Broadcast Tools (2 tools)
- `resend_create_broadcast` - Send email to entire audience
- `resend_send_to_segment` - Send to filtered segment of audience

## Installation

```bash
cd tools/cortiware-resend-mcp
npm install
npm run build
```

## Configuration

Add to your `mcp-config.json`:

```json
{
  "mcpServers": {
    "resend-cortiware": {
      "command": "node",
      "args": ["path/to/cortiware-resend-mcp/dist/index.js"],
      "env": {
        "RESEND_API_KEY": "re_your_api_key_here"
      }
    }
  }
}
```

## Environment Variables

- `RESEND_API_KEY` - Your Resend API key (required)

## Usage Examples

### Send Email
```typescript
{
  "from": "onboarding@cortiware.com",
  "to": "customer@example.com",
  "subject": "Welcome to Cortiware",
  "html": "<h1>Welcome!</h1><p>Thanks for signing up.</p>"
}
```

### Add Domain
```typescript
{
  "name": "cortiware.com",
  "region": "us-east-1"
}
```

### Create Broadcast
```typescript
{
  "name": "Monthly Newsletter",
  "audience_id": "aud_123",
  "from": "newsletter@cortiware.com",
  "subject": "What's New This Month",
  "html": "<h1>Newsletter</h1>"
}
```

## Use Cases

### Type 1 Communications (Cortiware → Tenants)
- System notifications
- Onboarding emails
- Feature announcements
- Billing notifications

### Type 2 Communications (Tenant → Customers)
- Each tenant uses their own Resend API key
- Branded emails from tenant's domain
- Customer communications

## Development

```bash
npm run dev    # Watch mode
npm run build  # Production build
npm start      # Run server
```

## License

MIT

