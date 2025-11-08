/**
 * Resend Tool Definitions
 * Email API for developers
 * 
 * Categories:
 * - Emails: 10 tools
 * - Domains: 10 tools
 * - API Keys: 5 tools
 * - Contacts: 10 tools
 * - Audiences: 5 tools
 * 
 * Total: 40 tools
 */

export const RESEND_TOOLS = [
  // ============================================================
  // EMAILS - 10 tools
  // ============================================================
  {
    name: 'resend_send_email',
    description: 'Send an email',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Sender email address' },
        to: { type: 'array', items: { type: 'string' }, description: 'Recipient email addresses' },
        subject: { type: 'string', description: 'Email subject' },
        html: { type: 'string', description: 'HTML content' },
        text: { type: 'string', description: 'Plain text content' },
        cc: { type: 'array', items: { type: 'string' }, description: 'CC recipients' },
        bcc: { type: 'array', items: { type: 'string' }, description: 'BCC recipients' },
        replyTo: { type: 'string', description: 'Reply-to address' },
        attachments: { type: 'array', description: 'Email attachments' },
        tags: { type: 'array', description: 'Email tags' },
      },
      required: ['from', 'to', 'subject'],
    },
  },
  {
    name: 'resend_get_email',
    description: 'Get an email by ID',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'string', description: 'Email ID' },
      },
      required: ['emailId'],
    },
  },
  {
    name: 'resend_list_emails',
    description: 'List sent emails',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of emails to return' },
        offset: { type: 'number', description: 'Offset for pagination' },
      },
    },
  },
  {
    name: 'resend_cancel_email',
    description: 'Cancel a scheduled email',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'string', description: 'Email ID' },
      },
      required: ['emailId'],
    },
  },
  {
    name: 'resend_send_batch_emails',
    description: 'Send multiple emails in a batch',
    inputSchema: {
      type: 'object',
      properties: {
        emails: { type: 'array', description: 'Array of email objects' },
      },
      required: ['emails'],
    },
  },
  {
    name: 'resend_schedule_email',
    description: 'Schedule an email for later delivery',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Sender email address' },
        to: { type: 'array', items: { type: 'string' }, description: 'Recipients' },
        subject: { type: 'string', description: 'Email subject' },
        html: { type: 'string', description: 'HTML content' },
        scheduledAt: { type: 'string', description: 'ISO 8601 timestamp' },
      },
      required: ['from', 'to', 'subject', 'scheduledAt'],
    },
  },
  {
    name: 'resend_get_email_events',
    description: 'Get events for an email',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'string', description: 'Email ID' },
      },
      required: ['emailId'],
    },
  },
  {
    name: 'resend_resend_email',
    description: 'Resend a previously sent email',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'string', description: 'Email ID to resend' },
        to: { type: 'array', items: { type: 'string' }, description: 'New recipients' },
      },
      required: ['emailId'],
    },
  },
  {
    name: 'resend_get_email_stats',
    description: 'Get statistics for sent emails',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date (ISO 8601)' },
        endDate: { type: 'string', description: 'End date (ISO 8601)' },
      },
    },
  },
  {
    name: 'resend_validate_email',
    description: 'Validate an email address',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email address to validate' },
      },
      required: ['email'],
    },
  },

  // ============================================================
  // DOMAINS - 10 tools
  // ============================================================
  {
    name: 'resend_list_domains',
    description: 'List all domains',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'resend_get_domain',
    description: 'Get a domain by ID',
    inputSchema: {
      type: 'object',
      properties: {
        domainId: { type: 'string', description: 'Domain ID' },
      },
      required: ['domainId'],
    },
  },
  {
    name: 'resend_create_domain',
    description: 'Add a new domain',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Domain name' },
        region: { type: 'string', description: 'Region (us-east-1, eu-west-1, etc.)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'resend_delete_domain',
    description: 'Delete a domain',
    inputSchema: {
      type: 'object',
      properties: {
        domainId: { type: 'string', description: 'Domain ID' },
      },
      required: ['domainId'],
    },
  },
  {
    name: 'resend_verify_domain',
    description: 'Verify a domain',
    inputSchema: {
      type: 'object',
      properties: {
        domainId: { type: 'string', description: 'Domain ID' },
      },
      required: ['domainId'],
    },
  },
  {
    name: 'resend_update_domain',
    description: 'Update domain settings',
    inputSchema: {
      type: 'object',
      properties: {
        domainId: { type: 'string', description: 'Domain ID' },
        trackOpens: { type: 'boolean', description: 'Track email opens' },
        trackClicks: { type: 'boolean', description: 'Track link clicks' },
      },
      required: ['domainId'],
    },
  },
  {
    name: 'resend_get_domain_dns',
    description: 'Get DNS records for a domain',
    inputSchema: {
      type: 'object',
      properties: {
        domainId: { type: 'string', description: 'Domain ID' },
      },
      required: ['domainId'],
    },
  },
  {
    name: 'resend_get_domain_stats',
    description: 'Get statistics for a domain',
    inputSchema: {
      type: 'object',
      properties: {
        domainId: { type: 'string', description: 'Domain ID' },
        startDate: { type: 'string', description: 'Start date' },
        endDate: { type: 'string', description: 'End date' },
      },
      required: ['domainId'],
    },
  },
  {
    name: 'resend_test_domain',
    description: 'Send a test email from a domain',
    inputSchema: {
      type: 'object',
      properties: {
        domainId: { type: 'string', description: 'Domain ID' },
        to: { type: 'string', description: 'Test recipient email' },
      },
      required: ['domainId', 'to'],
    },
  },
  {
    name: 'resend_get_domain_reputation',
    description: 'Get reputation score for a domain',
    inputSchema: {
      type: 'object',
      properties: {
        domainId: { type: 'string', description: 'Domain ID' },
      },
      required: ['domainId'],
    },
  },

  // ============================================================
  // API KEYS - 5 tools
  // ============================================================
  {
    name: 'resend_list_api_keys',
    description: 'List all API keys',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'resend_create_api_key',
    description: 'Create a new API key',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'API key name' },
        permission: { type: 'string', description: 'Permission level (full_access, sending_access)' },
        domainId: { type: 'string', description: 'Restrict to specific domain' },
      },
      required: ['name'],
    },
  },
  {
    name: 'resend_delete_api_key',
    description: 'Delete an API key',
    inputSchema: {
      type: 'object',
      properties: {
        apiKeyId: { type: 'string', description: 'API key ID' },
      },
      required: ['apiKeyId'],
    },
  },
  {
    name: 'resend_get_api_key',
    description: 'Get an API key by ID',
    inputSchema: {
      type: 'object',
      properties: {
        apiKeyId: { type: 'string', description: 'API key ID' },
      },
      required: ['apiKeyId'],
    },
  },
  {
    name: 'resend_update_api_key',
    description: 'Update an API key',
    inputSchema: {
      type: 'object',
      properties: {
        apiKeyId: { type: 'string', description: 'API key ID' },
        name: { type: 'string', description: 'New name' },
      },
      required: ['apiKeyId'],
    },
  },

  // ============================================================
  // CONTACTS - 10 tools
  // ============================================================
  {
    name: 'resend_list_contacts',
    description: 'List all contacts',
    inputSchema: {
      type: 'object',
      properties: {
        audienceId: { type: 'string', description: 'Filter by audience ID' },
      },
    },
  },
  {
    name: 'resend_get_contact',
    description: 'Get a contact by ID',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact ID' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'resend_create_contact',
    description: 'Create a new contact',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Contact email' },
        firstName: { type: 'string', description: 'First name' },
        lastName: { type: 'string', description: 'Last name' },
        audienceId: { type: 'string', description: 'Audience ID' },
      },
      required: ['email', 'audienceId'],
    },
  },
  {
    name: 'resend_update_contact',
    description: 'Update a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact ID' },
        firstName: { type: 'string', description: 'First name' },
        lastName: { type: 'string', description: 'Last name' },
        unsubscribed: { type: 'boolean', description: 'Unsubscribe status' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'resend_delete_contact',
    description: 'Delete a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact ID' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'resend_import_contacts',
    description: 'Import multiple contacts',
    inputSchema: {
      type: 'object',
      properties: {
        audienceId: { type: 'string', description: 'Audience ID' },
        contacts: { type: 'array', description: 'Array of contact objects' },
      },
      required: ['audienceId', 'contacts'],
    },
  },
  {
    name: 'resend_export_contacts',
    description: 'Export contacts from an audience',
    inputSchema: {
      type: 'object',
      properties: {
        audienceId: { type: 'string', description: 'Audience ID' },
        format: { type: 'string', description: 'Export format (csv, json)' },
      },
      required: ['audienceId'],
    },
  },
  {
    name: 'resend_unsubscribe_contact',
    description: 'Unsubscribe a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact ID' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'resend_resubscribe_contact',
    description: 'Resubscribe a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'string', description: 'Contact ID' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'resend_search_contacts',
    description: 'Search contacts by email or name',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        audienceId: { type: 'string', description: 'Filter by audience' },
      },
      required: ['query'],
    },
  },

  // ============================================================
  // AUDIENCES - 5 tools
  // ============================================================
  {
    name: 'resend_list_audiences',
    description: 'List all audiences',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'resend_get_audience',
    description: 'Get an audience by ID',
    inputSchema: {
      type: 'object',
      properties: {
        audienceId: { type: 'string', description: 'Audience ID' },
      },
      required: ['audienceId'],
    },
  },
  {
    name: 'resend_create_audience',
    description: 'Create a new audience',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Audience name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'resend_delete_audience',
    description: 'Delete an audience',
    inputSchema: {
      type: 'object',
      properties: {
        audienceId: { type: 'string', description: 'Audience ID' },
      },
      required: ['audienceId'],
    },
  },
  {
    name: 'resend_get_audience_stats',
    description: 'Get statistics for an audience',
    inputSchema: {
      type: 'object',
      properties: {
        audienceId: { type: 'string', description: 'Audience ID' },
      },
      required: ['audienceId'],
    },
  },
];
