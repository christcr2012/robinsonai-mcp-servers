import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import pLimit from 'p-limit';

import * as github from './vendors/github.js';
import * as vercel from './vendors/vercel.js';
import * as neon from './vendors/neon.js';
import * as stripe from './vendors/stripe.js';
import * as supabase from './vendors/supabase.js';
import * as twilio from './vendors/twilio.js';
import * as resend from './vendors/resend.js';
import * as cloudflare from './vendors/cloudflare.js';
import * as redis from './vendors/redis.js';
import * as gws from './vendors/google-workspace.js';
import * as flyio from './vendors/flyio.js';

const V = [github, vercel, neon, stripe, supabase, twilio, resend, cloudflare, redis, gws, flyio];
const limit = pLimit(parseInt(process.env.RTK_MAX_ACTIVE || '12', 10));

export function providerCatalog(): Tool[] {
  return V.flatMap(v => v.catalog().map(t => ({ ...t, name: `${v.id}.${t.name}` })));
}

export async function ensureProviders(): Promise<void> {
  await Promise.all(V.map(v => limit(() => v.ensureClient())));
}

export async function routeProviderCall(name: string, args: unknown) {
  const [vendorName, ...rest] = name.split('.');
  const inner = rest.join('.');
  const v = V.find(x => x.id === vendorName);
  if (!v) return { content: [{ type: 'text', text: `Unknown provider: ${vendorName}` }] };
  if (!v.isReady()) {
    return {
      content: [{
        type: 'text',
        text: `Provider '${v.id}' not configured. Missing: ${v.missingEnv().join(', ') || 'n/a'}. Add keys to RTK_DOTENV_PATH or Augment env.`
      }]
    };
  }
  return v.call(inner, args);
}

