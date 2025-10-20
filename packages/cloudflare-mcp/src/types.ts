import { z } from 'zod';

// DNS Record Types
export const CreateDnsRecordSchema = z.object({
  zone_id: z.string(),
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR']),
  name: z.string(),
  content: z.string(),
  ttl: z.number().optional(),
  priority: z.number().optional(),
  proxied: z.boolean().optional(),
});

export const UpdateDnsRecordSchema = z.object({
  zone_id: z.string(),
  record_id: z.string(),
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR']).optional(),
  name: z.string().optional(),
  content: z.string().optional(),
  ttl: z.number().optional(),
  priority: z.number().optional(),
  proxied: z.boolean().optional(),
});

// Zone Types
export const CreateZoneSchema = z.object({
  name: z.string(),
  account_id: z.string(),
  jump_start: z.boolean().optional(),
  type: z.enum(['full', 'partial']).optional(),
});

// Domain Types (Registrar)
export const RegisterDomainSchema = z.object({
  name: z.string(),
  years: z.number().min(1).max(10).optional(),
  auto_renew: z.boolean().optional(),
  privacy: z.boolean().optional(),
  registrant: z.object({
    first_name: z.string(),
    last_name: z.string(),
    organization: z.string().optional(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
});

export const TransferDomainSchema = z.object({
  name: z.string(),
  auth_code: z.string(),
  years: z.number().min(1).max(10).optional(),
  auto_renew: z.boolean().optional(),
  privacy: z.boolean().optional(),
});

// SSL/TLS Types
export const CreateSslCertificateSchema = z.object({
  zone_id: z.string(),
  type: z.enum(['universal', 'advanced']).optional(),
  hosts: z.array(z.string()).optional(),
  validation_method: z.enum(['http', 'txt', 'email']).optional(),
});

export type CreateDnsRecord = z.infer<typeof CreateDnsRecordSchema>;
export type UpdateDnsRecord = z.infer<typeof UpdateDnsRecordSchema>;
export type CreateZone = z.infer<typeof CreateZoneSchema>;
export type RegisterDomain = z.infer<typeof RegisterDomainSchema>;
export type TransferDomain = z.infer<typeof TransferDomainSchema>;
export type CreateSslCertificate = z.infer<typeof CreateSslCertificateSchema>;

