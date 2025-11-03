import { z } from 'zod';

// SMS/MMS Types
export const SendSmsSchema = z.object({
  to: z.string(),
  from: z.string(),
  body: z.string(),
  media_url: z.array(z.string()).optional(),
  status_callback: z.string().url().optional(),
  max_price: z.string().optional(),
  validity_period: z.number().optional(),
  messaging_service_sid: z.string().optional(),
});

export const SendMmsSchema = z.object({
  to: z.string(),
  from: z.string(),
  body: z.string().optional(),
  media_url: z.array(z.string()),
  status_callback: z.string().url().optional(),
});

// Voice Types
export const MakeCallSchema = z.object({
  to: z.string(),
  from: z.string(),
  url: z.string().url().optional(),
  twiml: z.string().optional(),
  status_callback: z.string().url().optional(),
  status_callback_event: z.array(z.string()).optional(),
  timeout: z.number().optional(),
  record: z.boolean().optional(),
  recording_status_callback: z.string().url().optional(),
});

// Phone Number Types
export const BuyPhoneNumberSchema = z.object({
  phone_number: z.string().optional(),
  area_code: z.string().optional(),
  friendly_name: z.string().optional(),
  sms_url: z.string().url().optional(),
  voice_url: z.string().url().optional(),
  status_callback: z.string().url().optional(),
});

export const UpdatePhoneNumberSchema = z.object({
  phone_number_sid: z.string(),
  friendly_name: z.string().optional(),
  sms_url: z.string().url().optional(),
  voice_url: z.string().url().optional(),
  status_callback: z.string().url().optional(),
  voice_method: z.enum(['GET', 'POST']).optional(),
  sms_method: z.enum(['GET', 'POST']).optional(),
});

// Messaging Service Types
export const CreateMessagingServiceSchema = z.object({
  friendly_name: z.string(),
  inbound_request_url: z.string().url().optional(),
  inbound_method: z.enum(['GET', 'POST']).optional(),
  fallback_url: z.string().url().optional(),
  status_callback: z.string().url().optional(),
  use_inbound_webhook_on_number: z.boolean().optional(),
});

// Subaccount Types
export const CreateSubaccountSchema = z.object({
  friendly_name: z.string(),
});

// Webhook Types
export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()),
  webhook_method: z.enum(['GET', 'POST']).optional(),
});

export type SendSms = z.infer<typeof SendSmsSchema>;
export type SendMms = z.infer<typeof SendMmsSchema>;
export type MakeCall = z.infer<typeof MakeCallSchema>;
export type BuyPhoneNumber = z.infer<typeof BuyPhoneNumberSchema>;
export type UpdatePhoneNumber = z.infer<typeof UpdatePhoneNumberSchema>;
export type CreateMessagingService = z.infer<typeof CreateMessagingServiceSchema>;
export type CreateSubaccount = z.infer<typeof CreateSubaccountSchema>;
export type CreateWebhook = z.infer<typeof CreateWebhookSchema>;

