import { z } from 'zod';

// Email Types
export const EmailAddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const SendEmailSchema = z.object({
  from: z.string(),
  to: z.union([z.string(), z.array(z.string())]),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
  cc: z.union([z.string(), z.array(z.string())]).optional(),
  bcc: z.union([z.string(), z.array(z.string())]).optional(),
  reply_to: z.union([z.string(), z.array(z.string())]).optional(),
  tags: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    content_type: z.string().optional(),
  })).optional(),
  headers: z.record(z.string()).optional(),
  scheduled_at: z.string().optional(),
});

// Domain Types
export const AddDomainSchema = z.object({
  name: z.string(),
  region: z.enum(['us-east-1', 'eu-west-1', 'sa-east-1']).optional(),
});

export const UpdateDomainSchema = z.object({
  domain_id: z.string(),
  open_tracking: z.boolean().optional(),
  click_tracking: z.boolean().optional(),
});

// API Key Types
export const CreateApiKeySchema = z.object({
  name: z.string(),
  permission: z.enum(['full_access', 'sending_access']).optional(),
  domain_id: z.string().optional(),
});

// Broadcast Types
export const CreateBroadcastSchema = z.object({
  name: z.string(),
  audience_id: z.string(),
  from: z.string(),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
  reply_to: z.string().optional(),
  scheduled_at: z.string().optional(),
});

// Audience Types
export const CreateAudienceSchema = z.object({
  name: z.string(),
});

// Contact Types
export const CreateContactSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  unsubscribed: z.boolean().optional(),
  audience_id: z.string(),
});

export const UpdateContactSchema = z.object({
  contact_id: z.string(),
  audience_id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  unsubscribed: z.boolean().optional(),
});

// Template Types (Resend doesn't have native templates, but we can manage HTML templates)
export const CreateTemplateSchema = z.object({
  name: z.string(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
});

// Webhook Types
export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.complained',
    'email.bounced',
    'email.opened',
    'email.clicked',
  ])),
});

export const UpdateWebhookSchema = z.object({
  webhook_id: z.string(),
  url: z.string().url().optional(),
  events: z.array(z.enum([
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.complained',
    'email.bounced',
    'email.opened',
    'email.clicked',
  ])).optional(),
});

export type EmailAddress = z.infer<typeof EmailAddressSchema>;
export type SendEmail = z.infer<typeof SendEmailSchema>;
export type AddDomain = z.infer<typeof AddDomainSchema>;
export type UpdateDomain = z.infer<typeof UpdateDomainSchema>;
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;
export type CreateBroadcast = z.infer<typeof CreateBroadcastSchema>;
export type CreateAudience = z.infer<typeof CreateAudienceSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;
export type CreateTemplate = z.infer<typeof CreateTemplateSchema>;
export type CreateWebhook = z.infer<typeof CreateWebhookSchema>;
export type UpdateWebhook = z.infer<typeof UpdateWebhookSchema>;

